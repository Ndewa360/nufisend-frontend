import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LEDGER_LABELS, PAYMENT_STATUS_LABELS, Payment } from 'app/core/wallet/wallet.types';
import { Subject, debounceTime } from 'rxjs';
import { FinanceApiService } from '../finance-api.service';

@Component({
    selector       : 'app-finance-payments',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="bg-card rounded-2xl shadow">
            <div class="flex flex-wrap items-center gap-3 p-4">
                <mat-form-field class="fuse-mat-dense flex-auto min-w-60" subscriptSizing="dynamic">
                    <mat-icon matPrefix svgIcon="heroicons_outline:search"></mat-icon>
                    <input matInput placeholder="Référence, téléphone, email…" [(ngModel)]="filters.search" (ngModelChange)="search$.next()">
                </mat-form-field>
                <mat-form-field class="fuse-mat-dense w-40" subscriptSizing="dynamic">
                    <mat-select [(ngModel)]="filters.status" (selectionChange)="reload(true)" placeholder="Statut">
                        <mat-option value="">Tous statuts</mat-option>
                        <mat-option *ngFor="let s of statuses" [value]="s">{{ statusLabels[s] }}</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-form-field class="fuse-mat-dense w-40" subscriptSizing="dynamic">
                    <mat-select [(ngModel)]="filters.operator" (selectionChange)="reload(true)" placeholder="Opérateur">
                        <mat-option value="">Tous opérateurs</mat-option>
                        <mat-option value="MTN">MTN</mat-option>
                        <mat-option value="ORANGE">Orange</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-form-field class="fuse-mat-dense w-40" subscriptSizing="dynamic">
                    <input matInput type="date" [(ngModel)]="filters.from" (change)="reload(true)" title="Du">
                </mat-form-field>
                <mat-form-field class="fuse-mat-dense w-40" subscriptSizing="dynamic">
                    <input matInput type="date" [(ngModel)]="filters.to" (change)="reload(true)" title="Au">
                </mat-form-field>
                <button mat-stroked-button (click)="export()"><mat-icon svgIcon="heroicons_outline:download"></mat-icon><span class="ml-2">CSV</span></button>
            </div>
            <div class="flex flex-wrap gap-4 px-4 pb-2 text-sm">
                <span *ngFor="let t of totals">{{ statusLabels[t._id] || t._id }} : <strong>{{ t.count }}</strong> ({{ t.amount | xaf }})</span>
            </div>
            <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 dark:bg-black dark:bg-opacity-5 text-secondary">
                        <tr>
                            <th class="px-4 py-3">Date</th><th class="px-4 py-3">Référence</th><th class="px-4 py-3">Client</th>
                            <th class="px-4 py-3">Opérateur</th><th class="px-4 py-3 text-right">Montant</th><th class="px-4 py-3 text-right">Frais</th>
                            <th class="px-4 py-3">Statut</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let p of payments" class="border-t cursor-pointer hover:bg-hover" (click)="open(p)">
                            <td class="px-4 py-3 whitespace-nowrap">{{ p.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td class="px-4 py-3 font-mono">{{ p.reference }}</td>
                            <td class="px-4 py-3">{{ p.user?.email }}</td>
                            <td class="px-4 py-3">{{ p.operator }} · {{ p.phone }}</td>
                            <td class="px-4 py-3 text-right font-medium">{{ p.amount | xaf }}</td>
                            <td class="px-4 py-3 text-right">{{ p.fee | xaf }}<span *ngIf="p.status === 'success' && !p.feeFromProvider" class="text-secondary" title="Estimation">*</span></td>
                            <td class="px-4 py-3"><span class="px-2 py-1 rounded-full text-xs font-semibold" [ngClass]="badge(p.status)">{{ statusLabels[p.status] }}</span></td>
                        </tr>
                        <tr *ngIf="!payments.length && !loading"><td colspan="7" class="px-4 py-8 text-center text-secondary">Aucun paiement</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="px-4 text-xs text-secondary">* frais estimés (non communiqués par Easy-Transact)</div>
            <mat-paginator [length]="total" [pageIndex]="page" [pageSize]="pageSize" [pageSizeOptions]="[20, 50, 100]" (page)="onPage($event)"></mat-paginator>
        </div>
    `,
})
export class FinancePaymentsComponent implements OnInit
{
    readonly statuses = ['pending', 'success', 'failed', 'expired'] as const;
    readonly statusLabels: Record<string, string> = PAYMENT_STATUS_LABELS;
    filters = { search: '', status: '', operator: '', from: '', to: '' };
    payments: Payment[] = [];
    totals: { _id: string; amount: number; count: number }[] = [];
    total = 0;
    page = 0;
    pageSize = 20;
    loading = false;
    readonly search$ = new Subject<void>();

    constructor(private _api: FinanceApiService, private _dialog: MatDialog, private _cdr: ChangeDetectorRef)
    {
        this.search$.pipe(debounceTime(300)).subscribe(() => this.reload(true));
    }

    ngOnInit(): void
    {
        this.reload();
    }

    private get query(): Record<string, any>
    {
        return {
            ...this.filters,
            from : this.filters.from ? new Date(`${this.filters.from}T00:00:00`) : '',
            to   : this.filters.to ? new Date(`${this.filters.to}T23:59:59`) : '',
            page : this.page + 1,
            limit: this.pageSize,
        };
    }

    reload(reset = false): void
    {
        if (reset) this.page = 0;
        this.loading = true;
        this._api.payments(this.query).subscribe({
            next : (res) => {
                this.payments = res.data;
                this.total = res.total;
                this.totals = res.totals;
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

    export(): void
    {
        const { page, limit, ...query } = this.query;
        this._api.download('/payments/export', query, 'nufisend-paiements.csv');
    }

    badge(status: string): string
    {
        return {
            success: 'bg-green-100 text-green-800',
            pending: 'bg-amber-100 text-amber-800',
            failed : 'bg-red-100 text-red-800',
            expired: 'bg-gray-200 text-gray-700',
        }[status] || '';
    }

    open(payment: Payment): void
    {
        this._dialog
            .open(PaymentDetailDialogComponent, { data: { id: payment._id }, width: '760px', maxWidth: '95vw', autoFocus: false })
            .afterClosed()
            .subscribe((changed) => changed && this.reload());
    }
}

@Component({
    selector       : 'app-payment-detail-dialog',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex items-center justify-between">
            <div class="text-xl font-semibold">Paiement {{ payment?.reference }}</div>
            <button mat-icon-button [mat-dialog-close]="changed"><mat-icon svgIcon="heroicons_outline:x"></mat-icon></button>
        </div>
        <mat-progress-bar *ngIf="!payment" mode="indeterminate"></mat-progress-bar>
        <div *ngIf="payment" class="flex flex-col gap-4 mt-4 max-h-[70vh] overflow-y-auto">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div><span class="text-secondary">Client :</span> {{ payment.user?.email }}</div>
                <div><span class="text-secondary">Statut :</span> <strong>{{ statusLabels[payment.status] }}</strong> <span class="text-secondary">({{ payment.providerStatus || '—' }})</span></div>
                <div><span class="text-secondary">Montant :</span> {{ payment.amount | xaf }}</div>
                <div><span class="text-secondary">Frais :</span> {{ payment.fee | xaf }} {{ payment.feeFromProvider ? '(Easy-Transact)' : '(estimés)' }}</div>
                <div><span class="text-secondary">Opérateur :</span> {{ payment.operator }} · {{ payment.phone }}</div>
                <div><span class="text-secondary">Réf. Easy-Transact :</span> {{ payment.providerRef || '—' }}</div>
                <div><span class="text-secondary">Créé :</span> {{ payment.createdAt | date:'dd/MM/yyyy HH:mm:ss' }}</div>
                <div><span class="text-secondary">Crédité :</span> {{ payment.creditedAt ? (payment.creditedAt | date:'dd/MM/yyyy HH:mm:ss') : '—' }}</div>
                <div><span class="text-secondary">Vérifications :</span> {{ payment.checkAttempts || 0 }}</div>
                <div *ngIf="payment.failureReason"><span class="text-secondary">Motif :</span> {{ payment.failureReason }}</div>
            </div>
            <div *ngIf="payment.ledger?.length">
                <div class="font-medium">Écritures</div>
                <div *ngFor="let e of payment.ledger" class="text-sm">{{ e.createdAt | date:'dd/MM HH:mm' }} · {{ ledgerLabels[e.type] }} · {{ e.amount | xaf }}</div>
            </div>
            <div>
                <div class="font-medium">Réponse à la demande</div>
                <pre class="text-xs bg-gray-100 dark:bg-black dark:bg-opacity-20 rounded p-3 overflow-x-auto">{{ payment.initResponse | json }}</pre>
            </div>
            <div>
                <div class="font-medium">Dernière vérification</div>
                <pre class="text-xs bg-gray-100 dark:bg-black dark:bg-opacity-20 rounded p-3 overflow-x-auto">{{ payment.lastCheckResponse | json }}</pre>
            </div>
            <div class="flex justify-end">
                <button mat-flat-button color="primary" [disabled]="checking || (payment.status !== 'pending' && payment.status !== 'expired')" (click)="recheck()">
                    Revérifier auprès d'Easy-Transact
                </button>
            </div>
        </div>
    `,
})
export class PaymentDetailDialogComponent implements OnInit
{
    readonly statusLabels: Record<string, string> = PAYMENT_STATUS_LABELS;
    readonly ledgerLabels = LEDGER_LABELS;
    payment: Payment | null = null;
    checking = false;
    changed = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) private _data: { id: string },
        private _api: FinanceApiService,
        private _snack: MatSnackBar,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void
    {
        this._api.payment(this._data.id).subscribe((payment) => {
            this.payment = payment;
            this._cdr.markForCheck();
        });
    }

    recheck(): void
    {
        this.checking = true;
        this._api.recheckPayment(this._data.id).subscribe({
            next : (payment) => {
                this.payment = payment;
                this.checking = false;
                this.changed = true;
                this._snack.open(`Statut : ${this.statusLabels[payment.status]}`, 'OK', { duration: 3000 });
                this._cdr.markForCheck();
            },
            error: () => {
                this.checking = false;
                this._cdr.markForCheck();
            },
        });
    }
}
