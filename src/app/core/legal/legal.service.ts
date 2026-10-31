import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, map, shareReplay } from 'rxjs';

interface ApiResponse<T>
{
    statusCode: number;
    message: string;
    data: T;
}

export type LegalDocumentId = 'terms' | 'privacy';

export interface LegalDocumentsInfo
{
    documents: { document: LegalDocumentId; title: string; version: string }[];
    retention: Record<string, number>;
    responseDelayDays: number;
}

export type PrivacyRequestType =
    | 'access' | 'portability' | 'rectification' | 'erasure'
    | 'opposition' | 'limitation' | 'withdraw_consent' | 'other';

export interface PrivacyRequest
{
    _id: string;
    reference: string;
    type: PrivacyRequestType;
    status: 'received' | 'in_progress' | 'completed' | 'rejected';
    message?: string;
    response?: string;
    automated?: boolean;
    email?: string;
    phone?: string;
    fullName?: string;
    createdAt: string;
    completedAt?: string | null;
    dueAt: string;
    user?: { email: string; firstName?: string; lastName?: string } | null;
    handledBy?: { email: string } | null;
}

export interface PrivacyOverview
{
    documents: LegalDocumentsInfo['documents'];
    pending: LegalDocumentId[];
    consents: { document: LegalDocumentId; version: string; acceptedAt: string; source: string }[];
    requests: PrivacyRequest[];
    deletion: {
        balance: number;
        reserved: number;
        contacts: number;
        activeCampaigns: number;
        organizationRole: string | null;
        ownerWithMembers: boolean;
    };
    retention: Record<string, number>;
}

export const PRIVACY_REQUEST_LABELS: Record<PrivacyRequestType, string> = {
    access          : 'Accès à mes données',
    portability     : 'Portabilité de mes données',
    rectification   : 'Rectification de données inexactes',
    erasure         : 'Effacement de mes données',
    opposition      : 'Opposition à un traitement (ex. ne plus recevoir de messages)',
    limitation      : 'Limitation du traitement',
    withdraw_consent: 'Retrait de mon consentement',
    other           : 'Autre question',
};

export const PRIVACY_STATUS_LABELS: Record<PrivacyRequest['status'], string> = {
    received   : 'Reçue',
    in_progress: 'En cours',
    completed  : 'Traitée',
    rejected   : 'Refusée',
};

export const LEGAL_DOCUMENT_PATHS: Record<LegalDocumentId, string> = {
    terms  : '/legal/conditions-utilisation',
    privacy: '/legal/confidentialite',
};

/** Documents legaux, consentements et droits sur les donnees personnelles. */
@Injectable({ providedIn: 'root' })
export class LegalService
{
    private _documents$: Observable<LegalDocumentsInfo> | null = null;

    constructor(private _http: HttpClient) {}

    documents(): Observable<LegalDocumentsInfo>
    {
        this._documents$ ??= this._http
            .get<ApiResponse<LegalDocumentsInfo>>(`${environment.apiUrl}/legal/documents`)
            .pipe(map((res) => res.data), shareReplay(1));
        return this._documents$;
    }

    overview(): Observable<PrivacyOverview>
    {
        return this._http.get<ApiResponse<PrivacyOverview>>(`${environment.apiUrl}/privacy/me`).pipe(map((res) => res.data));
    }

    accept(documents: LegalDocumentId[]): Observable<{ pending: LegalDocumentId[] }>
    {
        return this._http
            .post<ApiResponse<{ pending: LegalDocumentId[] }>>(`${environment.apiUrl}/privacy/consents`, { documents })
            .pipe(map((res) => res.data));
    }

    exportData(): Observable<Blob>
    {
        return this._http.get(`${environment.apiUrl}/privacy/export`, { responseType: 'blob' });
    }

    request(type: PrivacyRequestType, message: string): Observable<PrivacyRequest>
    {
        return this._http
            .post<ApiResponse<PrivacyRequest>>(`${environment.apiUrl}/privacy/requests`, { type, message })
            .pipe(map((res) => res.data));
    }

    publicRequest(input: { fullName: string; email: string; phone?: string; type: PrivacyRequestType; message: string; website?: string }): Observable<{ reference: string; dueAt: string }>
    {
        return this._http
            .post<ApiResponse<{ reference: string; dueAt: string }>>(`${environment.apiUrl}/legal/requests`, input)
            .pipe(map((res) => res.data));
    }

    deleteAccount(password: string): Observable<{ erased: boolean }>
    {
        return this._http
            .post<ApiResponse<{ erased: boolean }>>(`${environment.apiUrl}/privacy/delete-account`, { password, confirmation: 'SUPPRIMER' })
            .pipe(map((res) => res.data));
    }

    // ---------------------------------------------------------------- admin

    adminRequests(query: Record<string, any>): Observable<{ data: PrivacyRequest[]; total: number; page: number; limit: number; open: number }>
    {
        const params: Record<string, string> = {};
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') params[key] = String(value);
        });
        return this._http
            .get<ApiResponse<any>>(`${environment.apiUrl}/admin/privacy/requests`, { params })
            .pipe(map((res) => res.data));
    }

    adminUpdate(id: string, status: PrivacyRequest['status'], response: string): Observable<PrivacyRequest>
    {
        return this._http
            .patch<ApiResponse<PrivacyRequest>>(`${environment.apiUrl}/admin/privacy/requests/${id}`, { status, response })
            .pipe(map((res) => res.data));
    }
}
