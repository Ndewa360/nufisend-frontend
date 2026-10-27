import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, map } from 'rxjs';
import { LedgerEntry, Paginated, Payment } from 'app/core/wallet/wallet.types';

interface ApiResponse<T>
{
    statusCode: number;
    message: string;
    data: T;
}

export interface FinanceOverview
{
    currency: string;
    period: { from: string | null; to: string | null };
    platformWallet: {
        revenue: number;
        providerFees: number;
        margin: number;
        grossCollected: number;
        netCollected: number;
        customerFunds: number;
        customerAvailable: number;
        customerReserved: number;
        settlements: number;
        expectedProviderBalance: number;
        lastReconciliation: ReconciliationReport | null;
    };
    periodStats: {
        grossCollected: number;
        providerFees: number;
        netCollected: number;
        topupCount: number;
        averageTopup: number;
        payingUsers: number;
        revenue: number;
        margin: number;
        billedMessages: number;
        offeredMessages: number;
        offeredValue: number;
        writtenOffValue: number;
        adjustmentsCredit: number;
        adjustmentsDebit: number;
        failedPayments: number;
        operators: { operator: string; amount: number; count: number }[];
    };
    wallets: { available: number; reserved: number; wallets: number; fundedWallets: number; pendingPayments: number };
    provider: { configured: boolean };
}

export interface TimeseriesPoint
{
    bucket: string;
    topups: number;
    fees: number;
    topupCount: number;
    revenue: number;
    billedMessages: number;
    offeredMessages: number;
}

export interface ReconciliationReport
{
    _id: string;
    createdAt: string;
    expectedProviderBalance: number;
    actualProviderBalance: number | null;
    providerDifference: number | null;
    providerError: string | null;
    walletsTotal: number;
    ledgerTotal: number;
    walletMismatches: any[];
    stuckPendingPayments: number;
    ok: boolean;
    trigger: string;
}

export interface WalletRow
{
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    isBlocked: boolean;
    createdAt: string;
    available: number;
    reserved: number;
    totalTopup: number;
    totalSpent: number;
    customTextPrice: number | null;
    customAttachmentPrice: number | null;
}

export interface BillingSettings
{
    textPrice: number;
    attachmentPrice: number;
    freeMonthlyQuota: number;
    tiersEnabled: boolean;
    tiers: { minRecipients: number; discountPercent: number }[];
    minTopup: number;
    maxTopup: number;
    providerFeePercent: number;
    lowBalanceThreshold: number;
    reconciliationTolerance: number;
    alertEmails: string;
    companyName: string;
    companyAddress: string;
    companyTaxId: string;
    companyRegistry: string;
    vatRate: number;
    updatedAt?: string;
}

const toParams = (query: Record<string, any> = {}): HttpParams =>
{
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query))
        if (value !== null && value !== undefined && value !== '') params = params.set(key, value instanceof Date ? value.toISOString() : String(value));
    return params;
};

/** Appels du module financier du super-administrateur (`/admin/finance`). */
@Injectable({ providedIn: 'root' })
export class FinanceApiService
{
    private readonly _base = `${environment.apiUrl}/admin/finance`;

    constructor(private _http: HttpClient) {}

    private get<T>(path: string, query?: Record<string, any>): Observable<T>
    {
        return this._http.get<ApiResponse<T>>(`${this._base}${path}`, { params: toParams(query) }).pipe(map((res) => res.data));
    }

    overview(query: Record<string, any>): Observable<FinanceOverview>
    {
        return this.get('/overview', query);
    }

    timeseries(query: Record<string, any>): Observable<{ granularity: string; points: TimeseriesPoint[] }>
    {
        return this.get('/timeseries', query);
    }

    topCustomers(query: Record<string, any>): Observable<{ userId: string; email: string; name: string; revenue: number; messages: number }[]>
    {
        return this.get('/top-customers', query);
    }

    providerBalance(): Observable<{ configured: boolean; balance: number | null; currency: string; error: string | null }>
    {
        return this.get('/provider/balance');
    }

    payments(query: Record<string, any>): Observable<Paginated<Payment> & { totals: { _id: string; amount: number; count: number }[] }>
    {
        return this.get('/payments', query);
    }

    payment(id: string): Observable<Payment>
    {
        return this.get(`/payments/${id}`);
    }

    recheckPayment(id: string): Observable<Payment>
    {
        return this._http.post<ApiResponse<Payment>>(`${this._base}/payments/${id}/recheck`, {}).pipe(map((res) => res.data));
    }

    wallets(query: Record<string, any>): Observable<Paginated<WalletRow>>
    {
        return this.get('/wallets', query);
    }

    wallet(userId: string): Observable<any>
    {
        return this.get(`/wallets/${userId}`);
    }

    adjust(userId: string, body: { direction: 'credit' | 'debit'; amount: number; reason: string }): Observable<any>
    {
        return this._http.post<ApiResponse<any>>(`${this._base}/wallets/${userId}/adjustments`, body).pipe(map((res) => res.data));
    }

    setPricing(userId: string, body: { textPrice: number | null; attachmentPrice: number | null }): Observable<any>
    {
        return this._http.put<ApiResponse<any>>(`${this._base}/wallets/${userId}/pricing`, body).pipe(map((res) => res.data));
    }

    ledger(query: Record<string, any>): Observable<Paginated<LedgerEntry>>
    {
        return this.get('/ledger', query);
    }

    settings(): Observable<BillingSettings>
    {
        return this.get('/settings');
    }

    updateSettings(body: Partial<BillingSettings>): Observable<BillingSettings>
    {
        return this._http.put<ApiResponse<BillingSettings>>(`${this._base}/settings`, body).pipe(map((res) => res.data));
    }

    settlements(query: Record<string, any>): Observable<Paginated<any> & { totalAmount: number }>
    {
        return this.get('/settlements', query);
    }

    createSettlement(body: { amount: number; date?: string; reference?: string; note?: string }): Observable<any>
    {
        return this._http.post<ApiResponse<any>>(`${this._base}/settlements`, body).pipe(map((res) => res.data));
    }

    reconciliations(query: Record<string, any>): Observable<Paginated<ReconciliationReport>>
    {
        return this.get('/reconciliations', query);
    }

    reconcile(): Observable<ReconciliationReport>
    {
        return this._http.post<ApiResponse<ReconciliationReport>>(`${this._base}/reconciliations`, {}).pipe(map((res) => res.data));
    }

    audit(query: Record<string, any>): Observable<Paginated<any>>
    {
        return this.get('/audit', query);
    }

    /** Telecharge un export CSV (le jeton est ajoute par l'intercepteur). */
    download(path: string, query: Record<string, any>, filename: string): void
    {
        this._http.get(`${this._base}${path}`, { params: toParams(query), responseType: 'blob' }).subscribe((blob) =>
        {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        });
    }
}

/** Periodes predefinies des filtres financiers. */
export const PERIODS = [
    { id: '7d', label: '7 jours', days: 7 },
    { id: '30d', label: '30 jours', days: 30 },
    { id: '90d', label: '90 jours', days: 90 },
    { id: '365d', label: '12 mois', days: 365 },
    { id: 'all', label: 'Depuis le début', days: 0 },
];

export const periodQuery = (id: string): { from?: string; to?: string } =>
{
    const period = PERIODS.find((p) => p.id === id);
    if (!period || !period.days) return {};
    return { from: new Date(Date.now() - period.days * 86400_000).toISOString() };
};
