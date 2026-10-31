import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnDestroy,
    Output,
} from '@angular/core';
import { WalletService } from 'app/core/wallet/wallet.service';
import { SendQuote } from 'app/core/wallet/wallet.types';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap, takeUntil } from 'rxjs';

interface QuoteRequest
{
    recipients: number;
    hasAttachment: boolean;
    planification: any[] | null;
    category: string | null;
}

/**
 * Cout estime d'un envoi (ou montant reserve d'une programmation) affiche
 * avant validation, avec alerte et lien de recharge si le solde est insuffisant.
 */
@Component({
    selector       : 'app-message-cost-estimate',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div *ngIf="recipients > 0" class="rounded-xl border p-4 mt-6"
             [ngClass]="quote && !quote.sufficient ? 'border-amber-400 bg-amber-50 dark:bg-transparent' : 'border-gray-200'">
            <div class="flex items-center justify-between gap-4">
                <div class="font-medium">Coût estimé</div>
                <mat-progress-spinner *ngIf="loading" [diameter]="18" mode="indeterminate"></mat-progress-spinner>
            </div>

            <ng-container *ngIf="quote">
                <ng-container *ngIf="!isScheduled; else scheduled">
                    <div class="mt-2 text-sm">
                        {{ quote.recipients }} destinataire(s) × {{ quote.unitPrice | xaf }}
                        <span *ngIf="quote.discountPercent"> (remise {{ quote.discountPercent }} %)</span>
                        <span *ngIf="quote.freeUnits"> · {{ quote.freeUnits }} offert(s)</span>
                    </div>
                    <div class="mt-1 text-2xl font-bold">{{ quote.amountDue | xaf }}</div>
                    <div class="text-xs text-secondary">Montant maximal réservé : seuls les messages livrés seront facturés, le reste vous est rendu.</div>
                    <div *ngIf="category" class="text-xs text-secondary">Tarif WhatsApp Business ({{ category }}), débité du portefeuille de l'organisation.</div>
                </ng-container>
                <ng-template #scheduled>
                    <div class="mt-2 text-sm">
                        {{ quote.occurrenceAmount | xaf }} par envoi ({{ quote.recipients }} destinataire(s) × {{ quote.unitPrice | xaf }})
                    </div>
                    <div class="mt-1 text-2xl font-bold">{{ quote.amountDue | xaf }} <span class="text-base font-medium text-secondary">réservés maintenant</span></div>
                    <div class="text-xs text-secondary">
                        <ng-container *ngIf="quote.finiteOccurrences">{{ quote.finiteOccurrences }} envoi(s) programmé(s). </ng-container>
                        <ng-container *ngIf="quote.hasRecurrence">
                            Récurrence : {{ quote.weekOccurrences }} envoi(s) cette semaine, puis réservation chaque lundi pour la semaine.
                        </ng-container>
                        Les montants non utilisés vous sont rendus.
                    </div>
                </ng-template>

                <div class="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span>Solde disponible : <strong>{{ quote.available | xaf }}</strong></span>
                    <a *ngIf="!quote.sufficient" mat-stroked-button color="warn" routerLink="/wallet" (click)="navigate.emit()">
                        Recharger ({{ quote.amountDue - quote.available | xaf }} manquants)
                    </a>
                </div>
            </ng-container>
            <div *ngIf="error" class="mt-2 text-sm text-secondary">{{ error }}</div>
        </div>
    `,
})
export class MessageCostEstimateComponent implements OnChanges, OnDestroy
{
    @Input() recipients = 0;
    @Input() hasAttachment = false;
    @Input() isScheduled = false;
    @Input() planification: any[] | null = null;
    /** Categorie du modele WhatsApp (organisations) : tarif de l'API Cloud. */
    @Input() category: string | null = null;
    /** Vrai si le solde couvre l'envoi (ou si l'estimation est indisponible). */
    @Output() sufficientChange = new EventEmitter<boolean>();
    @Output() navigate = new EventEmitter<void>();

    quote: SendQuote | null = null;
    loading = false;
    error = '';

    private readonly _requests = new Subject<QuoteRequest>();
    private readonly _destroy$ = new Subject<void>();

    constructor(private _walletService: WalletService, private _cdr: ChangeDetectorRef)
    {
        this._requests
            .pipe(
                debounceTime(300),
                distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
                switchMap((request) => {
                    this.loading = true;
                    this._cdr.markForCheck();
                    return this._walletService
                        .quote(request.recipients, request.hasAttachment, request.planification || undefined, request.category)
                        .pipe(catchError(() => of(null)));
                }),
                takeUntil(this._destroy$),
            )
            .subscribe((quote) => {
                this.loading = false;
                this.quote = quote;
                this.error = quote ? '' : "L'estimation du coût est momentanément indisponible.";
                this.sufficientChange.emit(quote ? quote.sufficient : true);
                this._cdr.markForCheck();
            });
    }

    ngOnChanges(): void
    {
        if (this.recipients <= 0) {
            this.quote = null;
            this.sufficientChange.emit(true);
            return;
        }
        this._requests.next({
            recipients   : this.recipients,
            hasAttachment: this.hasAttachment,
            planification: this.isScheduled && this.planification?.length ? this.planification : null,
            category     : this.category,
        });
    }

    ngOnDestroy(): void
    {
        this._destroy$.next();
        this._destroy$.complete();
    }
}
