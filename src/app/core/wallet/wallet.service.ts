import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, Subject, map, tap } from 'rxjs';
import {
    LedgerEntry,
    Paginated,
    Payment,
    PaymentOperator,
    Receipt,
    SendQuote,
    WalletHold,
    WalletSummary,
} from './wallet.types';

interface ApiResponse<T> {
    statusCode: number;
    message: string;
    data: T;
}

/** Portefeuille de l'utilisateur connecte (solde, recharges, historique). */
@Injectable({ providedIn: 'root' })
export class WalletService
{
    private readonly _summary = new BehaviorSubject<WalletSummary | null>(null);
    /** Mouvement confirme par le serveur (recharge creditee, refusee...). */
    private readonly _changed = new Subject<void>();
    private readonly _baseUrl = `${environment.apiUrl}/wallet`;

    constructor(private _http: HttpClient) {}

    get summary$(): Observable<WalletSummary | null>
    {
        return this._summary.asObservable();
    }

    get changed$(): Observable<void>
    {
        return this._changed.asObservable();
    }

    /** Signale un changement du portefeuille (evenement temps reel) et recharge le solde. */
    notifyChanged(): void
    {
        this._changed.next();
        this.refresh().subscribe({ error: () => undefined });
    }

    refresh(): Observable<WalletSummary>
    {
        return this._http.get<ApiResponse<WalletSummary>>(this._baseUrl).pipe(
            map((res) => res.data),
            tap((summary) => this._summary.next(summary)),
        );
    }

    transactions(page = 1, limit = 20, type?: string): Observable<Paginated<LedgerEntry>>
    {
        let params = new HttpParams().set('page', page).set('limit', limit);
        if (type) params = params.set('type', type);
        return this._http
            .get<ApiResponse<Paginated<LedgerEntry>>>(`${this._baseUrl}/transactions`, { params })
            .pipe(map((res) => res.data));
    }

    reservations(): Observable<WalletHold[]>
    {
        return this._http
            .get<ApiResponse<WalletHold[]>>(`${this._baseUrl}/reservations`)
            .pipe(map((res) => res.data));
    }

    quote(recipients: number, hasAttachment: boolean, planification?: any[], category?: string | null): Observable<SendQuote>
    {
        return this._http
            .post<ApiResponse<SendQuote>>(`${this._baseUrl}/quote`, {
                recipients,
                hasAttachment,
                ...(planification?.length ? { planification } : {}),
                ...(category ? { category } : {}),
            })
            .pipe(map((res) => res.data));
    }

    topup(amount: number, phone: string, operator: PaymentOperator): Observable<Payment>
    {
        return this._http
            .post<ApiResponse<Payment>>(`${this._baseUrl}/topups`, { amount, phone, operator })
            .pipe(map((res) => res.data));
    }

    topups(page = 1, limit = 20): Observable<Paginated<Payment>>
    {
        const params = new HttpParams().set('page', page).set('limit', limit);
        return this._http
            .get<ApiResponse<Paginated<Payment>>>(`${this._baseUrl}/topups`, { params })
            .pipe(map((res) => res.data));
    }

    /** Statut d'une recharge (verifie aupres de l'operateur par le backend). */
    topupStatus(reference: string): Observable<Payment>
    {
        return this._http
            .get<ApiResponse<Payment>>(`${this._baseUrl}/topups/${encodeURIComponent(reference)}`)
            .pipe(map((res) => res.data));
    }

    receipt(reference: string): Observable<Receipt>
    {
        return this._http
            .get<ApiResponse<Receipt>>(`${this._baseUrl}/topups/${encodeURIComponent(reference)}/receipt`)
            .pipe(map((res) => res.data));
    }
}
