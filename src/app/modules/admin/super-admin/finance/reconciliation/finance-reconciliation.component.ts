import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FinanceApiService, ReconciliationReport } from '../finance-api.service';

/** Rapprochement Easy-Transact / grand livre et reversements vers la banque. */
@Component({
    selector       : 'app-finance-reconciliation',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div class="xl:col-span-2 bg-card rounded-2xl shadow">
                <div class="flex items-center justify-between p-4">
                    <div>
                        <div class="text-lg font-semibold">Rapprochements</div>
                        <div class="text-sm text-secondary">Automatique chaque jour à 06:00. Contrôle les wallets, le solde Easy-Transact et les recharges bloquées.</div>
                    </div>
                    <button mat-flat-button color="primary" [disabled]="running" (click)="run()">
                        <mat-progress-spinner *ngIf="running; else runLabel" [diameter]="20" mode="indeterminate"></mat-progress-spinner>
                        <ng-template #runLabel>Lancer maintenant</ng-template>
                    </button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="bg-gray-50 dark:bg-black dark:bg-opacity-5 text-secondary">
                            <tr>
                                <th class="px-4 py-3">Date</th><th class="px-4 py-3">Résultat</th><th class="px-4 py-3 text-right">Attendu</th>
                                <th class="px-4 py-3 text-right">Réel</th><th class="px-4 py-3 text-right">Écart</th><th class="px-4 py-3">Détails</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let r of reports" class="border-t align-top">
                                <td class="px-4 py-2 whitespace-nowrap">{{ r.createdAt | date:'dd/MM/yyyy HH:mm' }}<div class="text-xs text-secondary">{{ r.trigger }}</div></td>
                                <td class="px-4 py-2"><span class="px-2 py-1 rounded-full text-xs font-semibold" [ngClass]="r.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">{{ r.ok ? 'Conforme' : 'Anomalie' }}</span></td>
                                <td class="px-4 py-2 text-right whitespace-nowrap">{{ r.expectedProviderBalance | xaf }}</td>
                                <td class="px-4 py-2 text-right whitespace-nowrap">{{ r.actualProviderBalance !== null ? (r.actualProviderBalance | xaf) : '—' }}</td>
                                <td class="px-4 py-2 text-right whitespace-nowrap" [class.text-red-600]="r.providerDifference">{{ r.providerDifference !== null ? (r.providerDifference | xaf) : '—' }}</td>
                                <td class="px-4 py-2 text-xs">
                                    <div *ngIf="r.walletMismatches?.length" class="text-red-600">{{ r.walletMismatches.length }} wallet(s) incohérent(s)</div>
                                    <div *ngIf="r.stuckPendingPayments" class="text-amber-600">{{ r.stuckPendingPayments }} recharge(s) bloquée(s)</div>
                                    <div *ngIf="r.providerError" class="text-secondary">{{ r.providerError }}</div>
                                    <div class="text-secondary">Wallets {{ r.walletsTotal | xaf }} / grand livre {{ r.ledgerTotal | xaf }}</div>
                                </td>
                            </tr>
                            <tr *ngIf="!reports.length"><td colspan="6" class="px-4 py-8 text-center text-secondary">Aucun rapprochement</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="flex flex-col gap-6">
                <form class="bg-card rounded-2xl shadow p-4 flex flex-col gap-2" [formGroup]="form" (ngSubmit)="addSettlement()">
                    <div class="text-lg font-semibold">Enregistrer un reversement</div>
                    <div class="text-sm text-secondary">Virement du compte Easy-Transact vers la banque, effectué hors NufiSend. Indispensable pour un rapprochement juste.</div>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Montant (FCFA)</mat-label>
                        <input matInput type="number" min="1" formControlName="amount">
                    </mat-form-field>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Date</mat-label>
                        <input matInput type="date" formControlName="date">
                    </mat-form-field>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Référence</mat-label>
                        <input matInput formControlName="reference">
                    </mat-form-field>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Note</mat-label>
                        <input matInput formControlName="note">
                    </mat-form-field>
                    <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">Enregistrer</button>
                </form>

                <div class="bg-card rounded-2xl shadow p-4">
                    <div class="text-lg font-semibold">Reversements</div>
                    <div class="text-sm text-secondary">Total : {{ settlementsTotal | xaf }}</div>
                    <div *ngFor="let s of settlements" class="flex justify-between text-sm border-t py-2 mt-1">
                        <span>{{ s.date | date:'dd/MM/yyyy' }} · {{ s.reference || '—' }}<div class="text-xs text-secondary">{{ s.note }} · {{ s.actor?.email }}</div></span>
                        <span class="font-medium">{{ s.amount | xaf }}</span>
                    </div>
                    <div *ngIf="!settlements.length" class="text-sm text-secondary mt-2">Aucun reversement enregistré</div>
                </div>
            </div>
        </div>
    `,
})
export class FinanceReconciliationComponent implements OnInit
{
    reports: ReconciliationReport[] = [];
    settlements: any[] = [];
    settlementsTotal = 0;
    running = false;
    saving = false;

    readonly form = this._fb.group({
        amount   : [null as number | null, [Validators.required, Validators.min(1)]],
        date     : [new Date().toISOString().slice(0, 10)],
        reference: [''],
        note     : [''],
    });

    constructor(
        private _api: FinanceApiService,
        private _fb: FormBuilder,
        private _snack: MatSnackBar,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void
    {
        this.loadReports();
        this.loadSettlements();
    }

    loadReports(): void
    {
        this._api.reconciliations({ limit: 30 }).subscribe((res) => {
            this.reports = res.data;
            this._cdr.markForCheck();
        });
    }

    loadSettlements(): void
    {
        this._api.settlements({ limit: 20 }).subscribe((res) => {
            this.settlements = res.data;
            this.settlementsTotal = res.totalAmount;
            this._cdr.markForCheck();
        });
    }

    run(): void
    {
        this.running = true;
        this._api.reconcile().subscribe({
            next : (report) => {
                this.running = false;
                this._snack.open(report.ok ? 'Rapprochement conforme' : 'Anomalie détectée : une alerte a été envoyée', 'OK', { duration: 4000 });
                this.loadReports();
            },
            error: () => {
                this.running = false;
                this._cdr.markForCheck();
            },
        });
    }

    addSettlement(): void
    {
        const value = this.form.getRawValue();
        this.saving = true;
        this._api
            .createSettlement({
                amount   : Number(value.amount),
                date     : value.date || undefined,
                reference: value.reference || undefined,
                note     : value.note || undefined,
            })
            .subscribe({
                next : () => {
                    this.saving = false;
                    this.form.reset({ amount: null, date: new Date().toISOString().slice(0, 10), reference: '', note: '' });
                    this._snack.open('Reversement enregistré', 'OK', { duration: 3000 });
                    this.loadSettlements();
                },
                error: () => {
                    this.saving = false;
                    this._cdr.markForCheck();
                },
            });
    }
}
