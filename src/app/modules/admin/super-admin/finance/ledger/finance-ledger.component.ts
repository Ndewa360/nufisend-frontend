import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { LEDGER_LABELS, LedgerEntry, ledgerSign } from 'app/core/wallet/wallet.types';
import { FinanceApiService } from '../finance-api.service';

/** Grand livre global : toutes les ecritures de tous les wallets. */
@Component({
    selector       : 'app-finance-ledger',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="bg-card rounded-2xl shadow">
            <div class="flex flex-wrap items-center gap-3 p-4">
                <mat-form-field class="fuse-mat-dense w-64" subscriptSizing="dynamic">
                    <mat-select [(ngModel)]="type" (selectionChange)="reload(true)" placeholder="Type d'écriture">
                        <mat-option value="">Toutes les écritures</mat-option>
                        <mat-option value="capture,debit">Chiffre d'affaires (messages facturés)</mat-option>
                        <mat-option *ngFor="let t of types" [value]="t">{{ labels[t] }}</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-form-field class="fuse-mat-dense w-40" subscriptSizing="dynamic">
                    <input matInput type="date" [(ngModel)]="from" (change)="reload(true)" title="Du">
                </mat-form-field>
                <mat-form-field class="fuse-mat-dense w-40" subscriptSizing="dynamic">
                    <input matInput type="date" [(ngModel)]="to" (change)="reload(true)" title="Au">
                </mat-form-field>
                <div class="flex-auto"></div>
                <mat-form-field class="fuse-mat-dense w-40" subscriptSizing="dynamic">
                    <input matInput type="month" [(ngModel)]="month" title="Rapport mensuel">
                </mat-form-field>
                <button mat-stroked-button [disabled]="!month" (click)="monthlyReport()">
                    <mat-icon svgIcon="heroicons_outline:document-report"></mat-icon><span class="ml-2">Rapport mensuel</span>
                </button>
                <button mat-stroked-button (click)="export()"><mat-icon svgIcon="heroicons_outline:download"></mat-icon><span class="ml-2">CSV</span></button>
            </div>
            <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 dark:bg-black dark:bg-opacity-5 text-secondary">
                        <tr>
                            <th class="px-4 py-3">Date</th><th class="px-4 py-3">Client</th><th class="px-4 py-3">Type</th>
                            <th class="px-4 py-3">Description</th><th class="px-4 py-3 text-right">Montant</th>
                            <th class="px-4 py-3 text-right">Dispo. après</th><th class="px-4 py-3 text-right">Réservé après</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let e of entries" class="border-t">
                            <td class="px-4 py-2 whitespace-nowrap">{{ e.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td class="px-4 py-2">{{ e.user?.email }}</td>
                            <td class="px-4 py-2 whitespace-nowrap">{{ labels[e.type] || e.type }}</td>
                            <td class="px-4 py-2 text-secondary">
                                {{ e.description }}
                                <span *ngIf="e.actor?.email" class="text-xs"> — par {{ e.actor.email }}</span>
                            </td>
                            <td class="px-4 py-2 text-right whitespace-nowrap" [class.text-green-600]="sign(e.type) > 0" [class.text-red-600]="sign(e.type) < 0">
                                {{ e.type === 'free' || e.type === 'write_off' ? (e.value | xaf) + ' (valeur)' : (e.amount | xaf) }}
                            </td>
                            <td class="px-4 py-2 text-right whitespace-nowrap">{{ e.availableAfter | xaf }}</td>
                            <td class="px-4 py-2 text-right whitespace-nowrap">{{ e.reservedAfter | xaf }}</td>
                        </tr>
                        <tr *ngIf="!entries.length && !loading"><td colspan="7" class="px-4 py-8 text-center text-secondary">Aucune écriture</td></tr>
                    </tbody>
                </table>
            </div>
            <mat-paginator [length]="total" [pageIndex]="page" [pageSize]="pageSize" [pageSizeOptions]="[50, 100, 200]" (page)="onPage($event)"></mat-paginator>
        </div>
    `,
})
export class FinanceLedgerComponent implements OnInit
{
    readonly labels = LEDGER_LABELS;
    readonly types = Object.keys(LEDGER_LABELS);
    readonly sign = ledgerSign;
    entries: LedgerEntry[] = [];
    total = 0;
    page = 0;
    pageSize = 50;
    type = '';
    from = '';
    to = '';
    month = new Date().toISOString().slice(0, 7);
    loading = false;

    constructor(private _api: FinanceApiService, private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void
    {
        this.reload();
    }

    private get filters(): Record<string, any>
    {
        return {
            type: this.type,
            from: this.from ? new Date(`${this.from}T00:00:00`) : '',
            to  : this.to ? new Date(`${this.to}T23:59:59`) : '',
        };
    }

    reload(reset = false): void
    {
        if (reset) this.page = 0;
        this.loading = true;
        this._api.ledger({ ...this.filters, page: this.page + 1, limit: this.pageSize }).subscribe({
            next : (res) => {
                this.entries = res.data;
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

    export(): void
    {
        this._api.download('/ledger/export', this.filters, 'nufisend-grand-livre.csv');
    }

    monthlyReport(): void
    {
        this._api.download('/reports/monthly', { month: this.month }, `nufisend-rapport-${this.month}.csv`);
    }
}
