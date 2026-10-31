import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { WalletService } from 'app/core/wallet/wallet.service';
import {
    LEDGER_LABELS,
    LedgerEntry,
    PAYMENT_STATUS_LABELS,
    Payment,
    WalletHold,
    WalletSummary,
    ledgerSign,
} from 'app/core/wallet/wallet.types';
import { Subject, takeUntil } from 'rxjs';
import { TopupDialogComponent } from './topup-dialog/topup-dialog.component';

@Component({
    selector       : 'app-wallet',
    templateUrl    : './wallet.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletComponent implements OnInit, OnDestroy
{
    readonly ledgerLabels = LEDGER_LABELS;
    readonly paymentLabels = PAYMENT_STATUS_LABELS;
    readonly ledgerSign = ledgerSign;

    summary: WalletSummary | null = null;
    loadingSummary = true;

    transactions: LedgerEntry[] = [];
    transactionsTotal = 0;
    transactionsPage = 0;
    transactionsFilter = '';

    payments: Payment[] = [];
    paymentsTotal = 0;
    paymentsPage = 0;

    reservations: WalletHold[] = [];

    readonly pageSize = 15;
    private readonly _destroy$ = new Subject<void>();

    constructor(
        private _walletService: WalletService,
        private _dialog: MatDialog,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void
    {
        this._walletService.summary$.pipe(takeUntil(this._destroy$)).subscribe((summary) => {
            this.summary = summary;
            this._cdr.markForCheck();
        });
        this.reloadAll();
    }

    ngOnDestroy(): void
    {
        this._destroy$.next();
        this._destroy$.complete();
    }

    reloadAll(): void
    {
        this.loadingSummary = true;
        this._walletService.refresh().subscribe({
            next : () => (this.loadingSummary = false),
            error: () => {
                this.loadingSummary = false;
                this._cdr.markForCheck();
            },
        });
        this.loadTransactions();
        this.loadPayments();
        this.loadReservations();
    }

    loadTransactions(): void
    {
        this._walletService
            .transactions(this.transactionsPage + 1, this.pageSize, this.transactionsFilter || undefined)
            .subscribe((page) => {
                this.transactions = page.data;
                this.transactionsTotal = page.total;
                this._cdr.markForCheck();
            });
    }

    loadPayments(): void
    {
        this._walletService.topups(this.paymentsPage + 1, this.pageSize).subscribe((page) => {
            this.payments = page.data;
            this.paymentsTotal = page.total;
            this._cdr.markForCheck();
        });
    }

    loadReservations(): void
    {
        this._walletService.reservations().subscribe((holds) => {
            this.reservations = holds;
            this._cdr.markForCheck();
        });
    }

    onTransactionsPage(event: PageEvent): void
    {
        this.transactionsPage = event.pageIndex;
        this.loadTransactions();
    }

    onTransactionsFilter(filter: string): void
    {
        this.transactionsFilter = filter;
        this.transactionsPage = 0;
        this.loadTransactions();
    }

    onPaymentsPage(event: PageEvent): void
    {
        this.paymentsPage = event.pageIndex;
        this.loadPayments();
    }

    openTopup(): void
    {
        if (!this.summary) return;
        this._dialog
            .open(TopupDialogComponent, { data: { summary: this.summary }, autoFocus: false, width: '520px', maxWidth: '95vw' })
            .afterClosed()
            .subscribe(() => this.reloadAll());
    }

    get isLow(): boolean
    {
        return !!this.summary && this.summary.available < (this.summary.lowBalanceThreshold || 0);
    }

    /** Membre d'une organisation : portefeuille partage de l'organisation. */
    get isOrganization(): boolean
    {
        return this.summary?.accountType === 'organization';
    }

    get canTopup(): boolean
    {
        return !this.summary || this.summary.canTopup !== false;
    }

    holdLabel(hold: WalletHold): string
    {
        if (hold.planification?.title) return hold.planification.title;
        if (hold.message?.title) return hold.message.title;
        return hold.kind === 'send' ? 'Envoi en cours' : 'Message programmé';
    }

    holdKind(hold: WalletHold): string
    {
        return { send: 'Envoi immédiat', schedule: 'Programmation', weekly: 'Semaine en cours' }[hold.kind] || hold.kind;
    }

    trackById(_: number, item: { _id: string }): string
    {
        return item._id;
    }
}
