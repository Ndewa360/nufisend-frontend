import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { WalletService } from 'app/core/wallet/wallet.service';
import { Receipt } from 'app/core/wallet/wallet.types';

/** Recu imprimable d'une recharge confirmee. */
@Component({
    selector       : 'app-receipt',
    changeDetection: ChangeDetectionStrategy.OnPush,
    styles         : [`
        @media print {
            .no-print { display: none !important; }
            .receipt-sheet { box-shadow: none !important; margin: 0 !important; }
        }
    `],
    template       : `
        <div class="flex flex-col items-center p-6 sm:p-10">
            <div class="no-print flex w-full max-w-2xl justify-between mb-4">
                <a mat-button routerLink="/wallet">
                    <mat-icon svgIcon="heroicons_outline:arrow-left"></mat-icon><span class="ml-2">Portefeuille</span>
                </a>
                <button mat-flat-button color="primary" (click)="print()" [disabled]="!receipt">
                    <mat-icon svgIcon="heroicons_outline:printer"></mat-icon><span class="ml-2">Imprimer / PDF</span>
                </button>
            </div>

            <fuse-alert *ngIf="error" class="w-full max-w-2xl" type="error" appearance="outline">{{ error }}</fuse-alert>

            <div *ngIf="receipt" class="receipt-sheet w-full max-w-2xl bg-card rounded-2xl shadow p-8">
                <div class="flex justify-between gap-6">
                    <div>
                        <div class="text-2xl font-bold">{{ receipt.company.name }}</div>
                        <div class="text-sm text-secondary whitespace-pre-line">{{ receipt.company.address }}</div>
                        <div *ngIf="receipt.company.taxId" class="text-sm text-secondary">NIU : {{ receipt.company.taxId }}</div>
                        <div *ngIf="receipt.company.registry" class="text-sm text-secondary">RCCM : {{ receipt.company.registry }}</div>
                    </div>
                    <div class="text-right">
                        <div class="text-xl font-semibold">Reçu de paiement</div>
                        <div class="text-sm font-mono">{{ receipt.receiptNumber }}</div>
                        <div class="text-sm text-secondary">{{ receipt.issuedAt | date:'dd/MM/yyyy HH:mm' }}</div>
                    </div>
                </div>

                <div class="mt-8">
                    <div class="text-sm text-secondary">Client</div>
                    <div class="font-medium">{{ receipt.customer.name }}</div>
                    <div class="text-sm">{{ receipt.customer.email }}</div>
                </div>

                <table class="w-full mt-8 text-left">
                    <thead class="border-b text-sm text-secondary">
                        <tr><th class="py-2">Désignation</th><th class="py-2 text-right">Montant</th></tr>
                    </thead>
                    <tbody>
                        <tr class="border-b">
                            <td class="py-3">
                                {{ receipt.description }}
                                <div class="text-xs text-secondary">
                                    {{ receipt.operator === 'MTN' ? 'MTN Mobile Money' : 'Orange Money' }} · {{ receipt.phone }}
                                    <span *ngIf="receipt.providerRef"> · Transaction {{ receipt.providerRef }}</span>
                                </div>
                            </td>
                            <td class="py-3 text-right">{{ receipt.amount | xaf }}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="flex flex-col items-end gap-1 mt-4">
                    <ng-container *ngIf="receipt.vatRate > 0">
                        <div class="flex gap-8"><span class="text-secondary">Montant HT</span><span>{{ receipt.amountExclTax | xaf }}</span></div>
                        <div class="flex gap-8"><span class="text-secondary">TVA ({{ receipt.vatRate }} %)</span><span>{{ receipt.vatAmount | xaf }}</span></div>
                    </ng-container>
                    <div class="flex gap-8 text-lg font-bold"><span>Total payé</span><span>{{ receipt.amount | xaf }}</span></div>
                </div>

                <div class="mt-10 text-xs text-secondary">{{ receipt.notice }}</div>
            </div>
        </div>
    `,
})
export class ReceiptComponent implements OnInit
{
    receipt: Receipt | null = null;
    error = '';

    constructor(
        private _route: ActivatedRoute,
        private _walletService: WalletService,
        private _cdr: ChangeDetectorRef,
    ) {}

    ngOnInit(): void
    {
        const reference = this._route.snapshot.paramMap.get('reference');
        this._walletService.receipt(reference).subscribe({
            next : (receipt) => {
                this.receipt = receipt;
                this._cdr.markForCheck();
            },
            error: (err) => {
                const message = err?.error?.message;
                this.error = Array.isArray(message) ? message.join(' ') : message || 'Reçu indisponible';
                this._cdr.markForCheck();
            },
        });
    }

    print(): void
    {
        window.print();
    }
}
