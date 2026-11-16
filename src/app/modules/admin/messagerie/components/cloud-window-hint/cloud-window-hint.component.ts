import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, SimpleChanges } from '@angular/core';
import { environment } from 'environments/environment';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface WindowPhone {
    phoneNumber: string;
    country?: string;
}

/** Numero WhatsApp d'un contact (libelle « whatsapp », sinon le premier numero). */
export function whatsappPhoneOf(contact: any): WindowPhone | null {
    const phones: any[] = contact?.phoneNumbers || [];
    const phone = phones.find((item) => item?.label === 'whatsapp') || phones[0];
    return phone?.phoneNumber ? { phoneNumber: phone.phoneNumber, country: phone.country } : null;
}

interface WindowStatus {
    total: number;
    open: number;
    closed: number;
    invalid: number;
}

/**
 * Indique, avant un envoi en texte libre (WhatsApp Business), combien de
 * destinataires peuvent le recevoir : Meta n'autorise le texte libre que dans
 * les 24 h qui suivent un message du contact.
 */
@Component({
    selector       : 'app-cloud-window-hint',
    standalone     : true,
    imports        : [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div *ngIf="status as s" class="mt-3 rounded-xl border p-3 text-sm"
             [ngClass]="s.open === 0 ? 'border-red-200 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                       : s.closed > 0 ? 'border-amber-200 bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
                       : 'border-green-200 bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300'">
            <ng-container *ngIf="s.open === 0; else partialOrFull">
                <strong>Texte libre impossible.</strong>
                Aucun des {{ s.total }} destinataire(s) n'a écrit à l'organisation dans les dernières 24 h.
                Choisissez un modèle approuvé par Meta.
            </ng-container>
            <ng-template #partialOrFull>
                <ng-container *ngIf="s.closed > 0; else allOpen">
                    <strong>{{ s.open }} destinataire(s) sur {{ s.total }}</strong> peuvent recevoir un texte libre.
                    Les {{ s.closed }} autre(s) ne recevront pas ce message : utilisez un modèle approuvé pour eux.
                </ng-container>
                <ng-template #allOpen>
                    <strong>Texte libre possible</strong> : les {{ s.open }} destinataire(s) ont écrit dans les dernières 24 h.
                </ng-template>
            </ng-template>
            <div *ngIf="s.invalid > 0" class="mt-1">{{ s.invalid }} numéro(s) invalide(s) ignoré(s).</div>
        </div>
    `,
})
export class CloudWindowHintComponent implements OnChanges, OnDestroy
{
    /** Numeros des destinataires (contacts choisis). */
    @Input() phones: WindowPhone[] = [];

    status: WindowStatus | null = null;

    private _request: Subscription | null = null;
    private readonly _url = `${environment.apiUrl}/organizations/me/whatsapp/window-status`;

    constructor(private _http: HttpClient, private _cdr: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void
    {
        if (!changes['phones']) return;
        this._request?.unsubscribe();
        const phones = (this.phones || []).filter((phone) => phone?.phoneNumber).slice(0, 500);
        if (phones.length === 0)
        {
            this.status = null;
            this._cdr.markForCheck();
            return;
        }
        // Debounce : une saisie rapide ne declenche qu'une verification.
        this._request = timer(300).pipe(
            switchMap(() => this._http.post<{ data: WindowStatus }>(this._url, { phones })),
        ).subscribe({
            next : (response) => {
                this.status = response?.data ?? null;
                this._cdr.markForCheck();
            },
            error: () => {
                this.status = null;
                this._cdr.markForCheck();
            },
        });
    }

    ngOnDestroy(): void
    {
        this._request?.unsubscribe();
    }
}
