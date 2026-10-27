import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { LEDGER_LABELS, PAYMENT_STATUS_LABELS, ledgerSign } from 'app/core/wallet/wallet.types';
import { XafPipe } from 'app/shared/pipes/xaf.pipe';
import { Subject, debounceTime } from 'rxjs';
import { FinanceApiService, WalletRow } from '../finance-api.service';

const errorText = (err: any): string =>
{
    const message = err?.error?.message;
    return Array.isArray(message) ? message.join(' ') : message || 'Une erreur est survenue';
};

@Component({
    selector       : 'app-finance-wallets',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="bg-card rounded-2xl shadow">
            <div class="flex flex-wrap items-center gap-3 p-4">
                <mat-form-field class="fuse-mat-dense flex-auto min-w-60" subscriptSizing="dynamic">
                    <mat-icon matPrefix svgIcon="heroicons_outline:search"></mat-icon>
                    <input matInput placeholder="Email, nom…" [(ngModel)]="search" (ngModelChange)="search$.next()">
                </mat-form-field>
                <mat-form-field class="fuse-mat-dense w-56" subscriptSizing="dynamic">
                    <mat-select [(ngModel)]="sort" (selectionChange)="reload(true)">
                        <mat-option value="available">Trier : solde disponible</mat-option>
                        <mat-option value="reserved">Trier : montant réservé</mat-option>
                        <mat-option value="totalSpent">Trier : consommation</mat-option>
                        <mat-option value="totalTopup">Trier : recharges</mat-option>
                        <mat-option value="createdAt">Trier : inscription</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-slide-toggle [(ngModel)]="funded" (change)="reload(true)">Avec solde uniquement</mat-slide-toggle>
            </div>
            <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 dark:bg-black dark:bg-opacity-5 text-secondary">
                        <tr>
                            <th class="px-4 py-3">Client</th><th class="px-4 py-3 text-right">Disponible</th><th class="px-4 py-3 text-right">Réservé</th>
                            <th class="px-4 py-3 text-right">Total rechargé</th><th class="px-4 py-3 text-right">Total consommé</th><th class="px-4 py-3">Tarif</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let w of wallets" class="border-t cursor-pointer hover:bg-hover" (click)="open(w)">
                            <td class="px-4 py-3">
                                <div class="font-medium">{{ w.firstName }} {{ w.lastName }}</div>
                                <div class="text-secondary">{{ w.email }} <span *ngIf="w.isBlocked" class="text-red-600">(bloqué)</span></div>
                            </td>
                            <td class="px-4 py-3 text-right font-medium">{{ w.available | xaf }}</td>
                            <td class="px-4 py-3 text-right">{{ w.reserved | xaf }}</td>
                            <td class="px-4 py-3 text-right">{{ w.totalTopup | xaf }}</td>
                            <td class="px-4 py-3 text-right">{{ w.totalSpent | xaf }}</td>
                            <td class="px-4 py-3">{{ (w.customTextPrice ?? null) !== null || (w.customAttachmentPrice ?? null) !== null ? 'Négocié' : 'Public' }}</td>
                        </tr>
                        <tr *ngIf="!wallets.length && !loading"><td colspan="6" class="px-4 py-8 text-center text-secondary">Aucun compte</td></tr>
                    </tbody>
                </table>
            </div>
            <mat-paginator [length]="total" [pageIndex]="page" [pageSize]="pageSize" [pageSizeOptions]="[20, 50, 100]" (page)="onPage($event)"></mat-paginator>
        </div>
    `,
})
export class FinanceWalletsComponent implements OnInit
{
    wallets: WalletRow[] = [];
    total = 0;
    page = 0;
    pageSize = 20;
    search = '';
    sort = 'available';
    funded = false;
    loading = false;
    readonly search$ = new Subject<void>();

    constructor(
        private _api: FinanceApiService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute,
        private _cdr: ChangeDetectorRef,
    )
    {
        this.search$.pipe(debounceTime(300)).subscribe(() => this.reload(true));
    }

    ngOnInit(): void
    {
        this.reload();
        // Lien direct depuis la fiche utilisateur : /super-admin/finance/wallets?user=<id>
        const userId = this._route.snapshot.queryParamMap.get('user');
        if (userId) this.openUser(userId);
    }

    reload(reset = false): void
    {
        if (reset) this.page = 0;
        this.loading = true;
        this._api
            .wallets({ search: this.search, sort: this.sort, funded: this.funded || '', page: this.page + 1, limit: this.pageSize })
            .subscribe({
                next : (res) => {
                    this.wallets = res.data;
                    this.total = res.total;
                    this.loading = false;
                    this._cdr.markForCheck();
                },
                error: () => {
                    this.loading = false;
                    this._cdr.markForCheck();
                },
            });
    }

    onPage(event: PageEvent): void
    {
        this.page = event.pageIndex;
        this.pageSize = event.pageSize;
        this.reload();
    }

    open(wallet: WalletRow): void
    {
        this.openUser(wallet._id);
    }

    openUser(userId: string): void
    {
        this._dialog
            .open(WalletDetailDialogComponent, { data: { userId }, width: '960px', maxWidth: '95vw', autoFocus: false })
            .afterClosed()
            .subscribe((changed) => changed && this.reload());
    }
}

@Component({
    selector       : 'app-wallet-detail-dialog',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex items-center justify-between">
            <div>
                <div class="text-xl font-semibold">{{ detail?.user?.firstName }} {{ detail?.user?.lastName }}</div>
                <div class="text-secondary">{{ detail?.user?.email }}</div>
            </div>
            <button mat-icon-button [mat-dialog-close]="changed"><mat-icon svgIcon="heroicons_outline:x"></mat-icon></button>
        </div>
        <mat-progress-bar *ngIf="!detail" mode="indeterminate"></mat-progress-bar>
        <div *ngIf="detail" class="flex flex-col gap-6 mt-4 max-h-[75vh] overflow-y-auto pr-1">
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div class="rounded-xl border p-3"><div class="text-xs text-secondary">Disponible</div><div class="text-xl font-bold">{{ detail.wallet.available | xaf }}</div></div>
                <div class="rounded-xl border p-3"><div class="text-xs text-secondary">Réservé</div><div class="text-xl font-bold">{{ detail.wallet.reserved | xaf }}</div></div>
                <div class="rounded-xl border p-3"><div class="text-xs text-secondary">Total rechargé</div><div class="text-xl font-bold">{{ detail.wallet.totalTopup | xaf }}</div></div>
                <div class="rounded-xl border p-3"><div class="text-xs text-secondary">Offerts restants</div><div class="text-xl font-bold">{{ detail.freeRemaining }}</div></div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form class="rounded-xl border p-4 flex flex-col gap-2" [formGroup]="adjustForm" (ngSubmit)="adjust()">
                    <div class="font-semibold">Ajustement manuel</div>
                    <mat-button-toggle-group formControlName="direction">
                        <mat-button-toggle value="credit">Créditer</mat-button-toggle>
                        <mat-button-toggle value="debit">Débiter</mat-button-toggle>
                    </mat-button-toggle-group>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Montant (FCFA)</mat-label>
                        <input matInput type="number" min="1" formControlName="amount">
                    </mat-form-field>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Motif (obligatoire, visible dans l'audit)</mat-label>
                        <input matInput formControlName="reason">
                    </mat-form-field>
                    <button mat-flat-button color="primary" type="submit" [disabled]="adjustForm.invalid || saving">Enregistrer</button>
                </form>

                <form class="rounded-xl border p-4 flex flex-col gap-2" [formGroup]="pricingForm" (ngSubmit)="savePricing()">
                    <div class="font-semibold">Tarif négocié</div>
                    <div class="text-xs text-secondary">Laisser vide pour appliquer le tarif public.</div>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Message texte (FCFA / destinataire)</mat-label>
                        <input matInput type="number" min="0" step="0.5" formControlName="textPrice">
                    </mat-form-field>
                    <mat-form-field class="fuse-mat-dense" subscriptSizing="dynamic">
                        <mat-label>Avec pièce jointe (FCFA / destinataire)</mat-label>
                        <input matInput type="number" min="0" step="0.5" formControlName="attachmentPrice">
                    </mat-form-field>
                    <button mat-stroked-button color="primary" type="submit" [disabled]="saving">Appliquer</button>
                </form>
            </div>

            <div *ngIf="detail.holds.length">
                <div class="font-semibold mb-2">Réservations actives</div>
                <div *ngFor="let h of detail.holds" class="flex justify-between text-sm border-t py-2">
                    <span>{{ h.planification?.title || h.description }} <span class="text-secondary">({{ h.kind }})</span></span>
                    <span>{{ h.remaining | xaf }} / {{ h.amount | xaf }}</span>
                </div>
            </div>

            <div>
                <div class="font-semibold mb-2">Recharges récentes</div>
                <div *ngFor="let p of detail.payments" class="flex justify-between text-sm border-t py-2">
                    <span>{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }} · <span class="font-mono">{{ p.reference }}</span> · {{ p.operator }}</span>
                    <span>{{ p.amount | xaf }} · {{ paymentLabels[p.status] }}</span>
                </div>
                <div *ngIf="!detail.payments.length" class="text-sm text-secondary">Aucune recharge</div>
            </div>

            <div>
                <div class="font-semibold mb-2">Derniers mouvements</div>
                <div *ngFor="let e of detail.ledger" class="grid grid-cols-12 gap-2 text-sm border-t py-2">
                    <span class="col-span-3">{{ e.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                    <span class="col-span-3">{{ ledgerLabels[e.type] || e.type }}</span>
                    <span class="col-span-4 text-secondary truncate" [title]="e.description">{{ e.description }}</span>
                    <span class="col-span-2 text-right" [class.text-green-600]="sign(e.type) > 0" [class.text-red-600]="sign(e.type) < 0">
                        {{ e.type === 'free' ? e.units + ' msg' : (e.amount | xaf) }}
                    </span>
                </div>
            </div>
        </div>
    `,
})
export class WalletDetailDialogComponent implements OnInit
{
    readonly ledgerLabels = LEDGER_LABELS;
    readonly paymentLabels: Record<string, string> = PAYMENT_STATUS_LABELS;
    readonly sign = ledgerSign;
    detail: any = null;
    saving = false;
    changed = false;

    readonly adjustForm = this._fb.group({
        direction: ['credit' as 'credit' | 'debit', Validators.required],
        amount   : [null as number | null, [Validators.required, Validators.min(1)]],
        reason   : ['', [Validators.required, Validators.minLength(5)]],
    });

    readonly pricingForm = this._fb.group({
        textPrice      : [null as number | null],
        attachmentPrice: [null as number | null],
    });

    constructor(
        @Inject(MAT_DIALOG_DATA) private _data: { userId: string },
        private _api: FinanceApiService,
        private _fb: FormBuilder,
        private _snack: MatSnackBar,
        private _confirm: FuseConfirmationService,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void
    {
        this.load();
    }

    load(): void
    {
        this._api.wallet(this._data.userId).subscribe((detail) => {
            this.detail = detail;
            this.pricingForm.patchValue({
                textPrice      : detail.wallet.customTextPrice ?? null,
                attachmentPrice: detail.wallet.customAttachmentPrice ?? null,
            });
            this._cdr.markForCheck();
        });
    }

    adjust(): void
    {
        const { direction, amount, reason } = this.adjustForm.getRawValue();
        const label = direction === 'credit' ? 'Créditer' : 'Débiter';
        this._confirm
            .open({
                title  : `${label} ${new XafPipe().transform(amount)}`,
                message: `${label} le portefeuille de ${this.detail.user.email} ? Motif : « ${reason} ». Cette opération est tracée.`,
                actions: { confirm: { label, color: direction === 'credit' ? 'primary' : 'warn' }, cancel: { label: 'Annuler' } },
            })
            .afterClosed()
            .subscribe((result) => {
                if (result !== 'confirmed') return;
                this.saving = true;
                this._api.adjust(this._data.userId, { direction, amount: Number(amount), reason }).subscribe({
                    next : () => {
                        this.saving = false;
                        this.changed = true;
                        this.adjustForm.reset({ direction: 'credit', amount: null, reason: '' });
                        this._snack.open('Ajustement enregistré', 'OK', { duration: 3000 });
                        this.load();
                    },
                    error: (err) => this._fail(err),
                });
            });
    }

    savePricing(): void
    {
        const value = this.pricingForm.getRawValue();
        const normalize = (price: any) => (price === null || price === '' || price === undefined ? null : Number(price));
        this.saving = true;
        this._api
            .setPricing(this._data.userId, { textPrice: normalize(value.textPrice), attachmentPrice: normalize(value.attachmentPrice) })
            .subscribe({
                next : () => {
                    this.saving = false;
                    this.changed = true;
                    this._snack.open('Tarif mis à jour', 'OK', { duration: 3000 });
                    this.load();
                },
                error: (err) => this._fail(err),
            });
    }

    private _fail(err: any): void
    {
        this.saving = false;
        this._snack.open(errorText(err), 'OK', { duration: 5000 });
        this._cdr.markForCheck();
    }
}
