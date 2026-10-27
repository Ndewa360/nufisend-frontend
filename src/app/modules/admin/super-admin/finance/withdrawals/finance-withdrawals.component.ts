import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroupDirective, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { XafPipe } from 'app/shared/pipes/xaf.pipe';
import { FinanceApiService, Withdrawal, WithdrawalSummary } from '../finance-api.service';

const errorText = (err: any): string =>
{
    const message = err?.error?.message;
    return Array.isArray(message) ? message.join(' ') : message || 'Une erreur est survenue';
};

const STATUS_LABELS: Record<string, string> = { pending: 'En attente', success: 'Effectué', failed: 'Échoué' };

/** Retraits du compte Easy-Transact vers un numero Mobile Money (super-admin). */
@Component({
    selector       : 'app-finance-withdrawals',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col gap-6">
            <div *ngIf="summary" class="grid grid-cols-2 xl:grid-cols-5 gap-4">
                <div class="bg-card rounded-2xl shadow p-4">
                    <div class="text-sm text-secondary">Solde Easy-Transact</div>
                    <div class="text-2xl font-bold">{{ summary.providerBalance !== null ? (summary.providerBalance | xaf) : '—' }}</div>
                    <div class="text-xs" [class.text-red-600]="summary.providerError" [class.text-secondary]="!summary.providerError">
                        {{ summary.providerError || ('Attendu ' + (summary.expectedProviderBalance | xaf)) }}
                    </div>
                </div>
                <div class="bg-card rounded-2xl shadow p-4">
                    <div class="text-sm text-secondary">Fonds clients</div>
                    <div class="text-2xl font-bold text-amber-600">{{ summary.customerFunds | xaf }}</div>
                    <div class="text-xs text-secondary">Prépayés, dus en service</div>
                </div>
                <div class="bg-card rounded-2xl shadow p-4 ring-2 ring-green-500 ring-opacity-40">
                    <div class="text-sm text-secondary">Retirable sans toucher aux fonds clients</div>
                    <div class="text-2xl font-bold text-green-700">{{ summary.withdrawableWithoutCustomerFunds | xaf }}</div>
                    <div class="text-xs text-secondary">Maximum technique {{ summary.withdrawable | xaf }}</div>
                </div>
                <div class="bg-card rounded-2xl shadow p-4">
                    <div class="text-sm text-secondary">En attente</div>
                    <div class="text-2xl font-bold">{{ summary.pendingWithdrawals | xaf }}</div>
                </div>
                <div class="bg-card rounded-2xl shadow p-4">
                    <div class="text-sm text-secondary">Total retiré</div>
                    <div class="text-2xl font-bold">{{ summary.totalWithdrawn | xaf }}</div>
                    <div class="text-xs text-secondary">Frais {{ summary.withdrawalFees | xaf }}</div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <form class="bg-card rounded-2xl shadow p-6 flex flex-col gap-3" [formGroup]="form" (ngSubmit)="confirm()">
                    <div class="text-lg font-semibold">Nouveau retrait</div>
                    <div class="text-sm text-secondary">
                        L'argent est envoyé depuis le compte Easy-Transact vers le numéro Mobile Money indiqué.
                        <span *ngIf="summary">Entre {{ summary.limits.min | xaf }} et {{ summary.limits.max | xaf }}<span *ngIf="summary.limits.daily"> · plafond 24 h {{ summary.limits.daily | xaf }}</span>.</span>
                    </div>

                    <mat-button-toggle-group formControlName="operator">
                        <mat-button-toggle value="MTN" class="flex-1" [disabled]="!summary?.configured?.MTN">MTN MoMo</mat-button-toggle>
                        <mat-button-toggle value="ORANGE" class="flex-1" [disabled]="!summary?.configured?.ORANGE">Orange Money</mat-button-toggle>
                    </mat-button-toggle-group>
                    <div *ngIf="summary && !summary.configured.MTN && !summary.configured.ORANGE" class="text-sm text-red-600">
                        Retraits non configurés : renseignez EASY_TRANSACT_SERVICE_CODE_WITHDRAWAL sur le serveur.
                    </div>

                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Montant (FCFA)</mat-label>
                        <input matInput type="number" min="1" formControlName="amount">
                    </mat-form-field>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Numéro du bénéficiaire</mat-label>
                        <span matTextPrefix>+237&nbsp;</span>
                        <input matInput formControlName="phone" placeholder="6XX XX XX XX" (blur)="detectOperator()">
                    </mat-form-field>
                    <div *ngIf="operatorMismatch" class="text-xs text-amber-600">
                        Ce numéro semble être un numéro {{ detectedOperator === 'MTN' ? 'MTN' : 'Orange' }} : vérifiez l'opérateur sélectionné.
                    </div>
                    <div *ngIf="summary?.limits.allowedPhones.length" class="text-xs text-secondary">
                        Numéros autorisés : {{ summary.limits.allowedPhones.join(', ') }}
                    </div>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Nom du bénéficiaire</mat-label>
                        <input matInput formControlName="beneficiaryName">
                    </mat-form-field>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Note (optionnelle)</mat-label>
                        <input matInput formControlName="note">
                    </mat-form-field>

                    <fuse-alert *ngIf="exceedsSafeAmount" type="warning" appearance="outline">
                        Ce montant dépasse ce qui peut être retiré sans entamer les fonds prépayés des clients
                        ({{ summary.withdrawableWithoutCustomerFunds | xaf }}).
                        <mat-checkbox class="block mt-2" formControlName="allowCustomerFunds">Je confirme vouloir entamer les fonds clients</mat-checkbox>
                    </fuse-alert>

                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Votre mot de passe</mat-label>
                        <input matInput type="password" formControlName="password" autocomplete="current-password">
                        <mat-hint>Requis pour chaque retrait</mat-hint>
                    </mat-form-field>

                    <button mat-flat-button color="warn" type="submit"
                            [disabled]="form.invalid || submitting || (exceedsSafeAmount && !form.value.allowCustomerFunds)">
                        <mat-progress-spinner *ngIf="submitting; else submitLabel" [diameter]="20" mode="indeterminate"></mat-progress-spinner>
                        <ng-template #submitLabel>Retirer {{ (form.value.amount || 0) | xaf }}</ng-template>
                    </button>
                </form>

                <div class="xl:col-span-2 bg-card rounded-2xl shadow">
                    <div class="flex items-center justify-between p-4">
                        <div class="text-lg font-semibold">Historique des retraits</div>
                        <button mat-icon-button (click)="reload()" matTooltip="Actualiser"><mat-icon svgIcon="heroicons_outline:refresh"></mat-icon></button>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-gray-50 dark:bg-black dark:bg-opacity-5 text-secondary">
                                <tr>
                                    <th class="px-4 py-3">Date</th><th class="px-4 py-3">Bénéficiaire</th><th class="px-4 py-3 text-right">Montant</th>
                                    <th class="px-4 py-3">Statut</th><th class="px-4 py-3">Par</th><th class="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let w of withdrawals" class="border-t align-top">
                                    <td class="px-4 py-2 whitespace-nowrap">{{ w.createdAt | date:'dd/MM/yyyy HH:mm' }}<div class="text-xs font-mono text-secondary">{{ w.reference }}</div></td>
                                    <td class="px-4 py-2">
                                        {{ w.beneficiaryName || '—' }}
                                        <div class="text-xs text-secondary">{{ w.operator }} · {{ w.phone }}</div>
                                        <div *ngIf="w.note" class="text-xs text-secondary">{{ w.note }}</div>
                                    </td>
                                    <td class="px-4 py-2 text-right whitespace-nowrap">
                                        <span class="font-medium">{{ w.amount | xaf }}</span>
                                        <div *ngIf="w.fee" class="text-xs text-secondary">frais {{ w.fee | xaf }}</div>
                                        <div *ngIf="w.usedCustomerFunds" class="text-xs text-amber-600">fonds clients</div>
                                    </td>
                                    <td class="px-4 py-2">
                                        <span class="px-2 py-1 rounded-full text-xs font-semibold" [ngClass]="badge(w.status)">{{ labels[w.status] }}</span>
                                        <div *ngIf="w.failureReason" class="text-xs text-secondary mt-1">{{ w.failureReason }}</div>
                                    </td>
                                    <td class="px-4 py-2 text-xs">{{ w.requestedBy?.email }}</td>
                                    <td class="px-4 py-2 text-right whitespace-nowrap">
                                        <ng-container *ngIf="w.status === 'pending'">
                                            <button mat-button color="primary" (click)="recheck(w)">Revérifier</button>
                                            <button mat-button (click)="resolve(w)">Clôturer</button>
                                        </ng-container>
                                    </td>
                                </tr>
                                <tr *ngIf="!withdrawals.length"><td colspan="6" class="px-4 py-8 text-center text-secondary">Aucun retrait</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <mat-paginator [length]="total" [pageIndex]="page" [pageSize]="20" [hidePageSize]="true" (page)="onPage($event)"></mat-paginator>
                </div>
            </div>
        </div>
    `,
})
export class FinanceWithdrawalsComponent implements OnInit
{
    @ViewChild(FormGroupDirective) private _formDirective: FormGroupDirective;
    readonly labels = STATUS_LABELS;
    summary: WithdrawalSummary | null = null;
    withdrawals: Withdrawal[] = [];
    total = 0;
    page = 0;
    submitting = false;

    readonly form = this._fb.group({
        operator          : ['MTN' as 'MTN' | 'ORANGE', Validators.required],
        amount            : [null as number | null, [Validators.required, Validators.min(1)]],
        phone             : ['', [Validators.required, Validators.pattern(/^(\+?237)?\s?6[\d\s]{8,11}$/)]],
        beneficiaryName   : ['', Validators.maxLength(100)],
        note              : ['', Validators.maxLength(500)],
        password          : ['', Validators.required],
        allowCustomerFunds: [false],
    });

    constructor(
        private _api: FinanceApiService,
        private _fb: FormBuilder,
        private _dialog: MatDialog,
        private _confirm: FuseConfirmationService,
        private _snack: MatSnackBar,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void
    {
        this.reload();
    }

    /** Operateur deduit du prefixe camerounais (67/650-654/68 MTN, 69/655-659 Orange). */
    get detectedOperator(): 'MTN' | 'ORANGE' | null
    {
        const digits = String(this.form.value.phone || '').replace(/\D/g, '').replace(/^237/, '');
        if (/^(67|65[0-4]|68)/.test(digits)) return 'MTN';
        if (/^(69|65[5-9])/.test(digits)) return 'ORANGE';
        return null;
    }

    get operatorMismatch(): boolean
    {
        return !!this.detectedOperator && this.detectedOperator !== this.form.value.operator;
    }

    detectOperator(): void
    {
        const operator = this.detectedOperator;
        if (operator && this.summary?.configured?.[operator]) this.form.patchValue({ operator });
    }

    get exceedsSafeAmount(): boolean
    {
        return !!this.summary && Number(this.form.value.amount || 0) > this.summary.withdrawableWithoutCustomerFunds;
    }

    reload(): void
    {
        this._api.withdrawalSummary().subscribe((summary) => {
            this.summary = summary;
            if (!summary.configured[this.form.value.operator] && summary.configured.ORANGE)
                this.form.patchValue({ operator: 'ORANGE' });
            this._cdr.markForCheck();
        });
        this._api.withdrawals({ page: this.page + 1, limit: 20 }).subscribe((res) => {
            this.withdrawals = res.data;
            this.total = res.total;
            this._cdr.markForCheck();
        });
    }

    onPage(event: PageEvent): void
    {
        this.page = event.pageIndex;
        this.reload();
    }

    badge(status: string): string
    {
        return { success: 'bg-green-100 text-green-800', pending: 'bg-amber-100 text-amber-800', failed: 'bg-red-100 text-red-800' }[status] || '';
    }

    confirm(): void
    {
        const value = this.form.getRawValue();
        const amount = new XafPipe().transform(value.amount);
        this._confirm
            .open({
                title  : `Retirer ${amount} ?`,
                message: (this.operatorMismatch ? `Attention : le numéro ne semble pas correspondre à l'opérateur choisi. ` : '')
                    + `${amount} seront envoyés au +237 ${value.phone} (${value.operator === 'MTN' ? 'MTN Mobile Money' : 'Orange Money'})`
                    + `${value.beneficiaryName ? ' — ' + value.beneficiaryName : ''}. Cette opération est irréversible et tracée.`,
                actions: { confirm: { label: 'Confirmer le retrait', color: 'warn' }, cancel: { label: 'Annuler' } },
            })
            .afterClosed()
            .subscribe((result) => result === 'confirmed' && this.submit());
    }

    private submit(): void
    {
        const value = this.form.getRawValue();
        this.submitting = true;
        this._api
            .createWithdrawal({
                amount            : Number(value.amount),
                operator          : value.operator,
                phone             : String(value.phone),
                beneficiaryName   : value.beneficiaryName || undefined,
                note              : value.note || undefined,
                password          : String(value.password),
                allowCustomerFunds: !!value.allowCustomerFunds,
            })
            .subscribe({
                next : (withdrawal) => {
                    this.submitting = false;
                    this._formDirective.resetForm({ operator: value.operator, amount: null, phone: '', beneficiaryName: '', note: '', password: '', allowCustomerFunds: false });
                    this._snack.open(
                        withdrawal.status === 'success' ? 'Retrait effectué' : 'Retrait envoyé : en attente de confirmation Easy-Transact',
                        'OK',
                        { duration: 5000 },
                    );
                    this.reload();
                },
                error: (err) => {
                    this.submitting = false;
                    this.form.patchValue({ password: '' });
                    this._snack.open(errorText(err), 'OK', { duration: 8000 });
                    this.reload();
                },
            });
    }

    recheck(withdrawal: Withdrawal): void
    {
        this._api.recheckWithdrawal(withdrawal._id).subscribe({
            next : (updated) => {
                this._snack.open(`Statut : ${this.labels[updated.status]}`, 'OK', { duration: 3000 });
                this.reload();
            },
            error: (err) => this._snack.open(errorText(err), 'OK', { duration: 5000 }),
        });
    }

    resolve(withdrawal: Withdrawal): void
    {
        this._dialog
            .open(ResolveWithdrawalDialogComponent, { data: withdrawal, width: '480px', maxWidth: '95vw', autoFocus: false })
            .afterClosed()
            .subscribe((done) => done && this.reload());
    }
}

/** Cloture manuelle d'un retrait reste en attente. */
@Component({
    selector       : 'app-resolve-withdrawal-dialog',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="text-xl font-semibold">Clôturer le retrait {{ data.reference }}</div>
        <div class="text-sm text-secondary mt-1">
            À utiliser uniquement après avoir vérifié le statut réel auprès d'Easy-Transact.
            Montant : {{ data.amount | xaf }} vers {{ data.phone }}.
        </div>
        <form class="flex flex-col gap-3 mt-4" [formGroup]="form" (ngSubmit)="submit()">
            <mat-button-toggle-group formControlName="status">
                <mat-button-toggle value="success" class="flex-1">Argent bien reçu</mat-button-toggle>
                <mat-button-toggle value="failed" class="flex-1">Retrait échoué</mat-button-toggle>
            </mat-button-toggle-group>
            <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                <mat-label>Motif / justificatif</mat-label>
                <input matInput formControlName="reason">
            </mat-form-field>
            <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                <mat-label>Votre mot de passe</mat-label>
                <input matInput type="password" formControlName="password" autocomplete="current-password">
            </mat-form-field>
            <div class="flex justify-end gap-2">
                <button mat-button type="button" [mat-dialog-close]="false">Annuler</button>
                <button mat-flat-button color="warn" type="submit" [disabled]="form.invalid || saving">Clôturer</button>
            </div>
        </form>
    `,
})
export class ResolveWithdrawalDialogComponent
{
    saving = false;
    readonly form = this._fb.group({
        status  : ['failed' as 'success' | 'failed', Validators.required],
        reason  : ['', [Validators.required, Validators.minLength(5)]],
        password: ['', Validators.required],
    });

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: Withdrawal,
        private _dialogRef: MatDialogRef<ResolveWithdrawalDialogComponent>,
        private _api: FinanceApiService,
        private _fb: FormBuilder,
        private _snack: MatSnackBar,
        private _cdr: ChangeDetectorRef,
    ) {}

    submit(): void
    {
        const value = this.form.getRawValue();
        this.saving = true;
        this._api.resolveWithdrawal(this.data._id, { status: value.status, reason: String(value.reason), password: String(value.password) }).subscribe({
            next : () => {
                this._snack.open('Retrait clôturé', 'OK', { duration: 3000 });
                this._dialogRef.close(true);
            },
            error: (err) => {
                this.saving = false;
                this._snack.open(errorText(err), 'OK', { duration: 6000 });
                this._cdr.markForCheck();
            },
        });
    }
}
