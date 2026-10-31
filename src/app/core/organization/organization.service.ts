import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { BehaviorSubject, Observable, catchError, filter, map, of, shareReplay, tap } from 'rxjs';
import {
    Conversation,
    InboxMessage,
    InvitationPreview,
    Membership,
    OrgRole,
    OrganizationInvitation,
    OrganizationMember,
    OrganizationWhatsapp,
    PlansCatalog,
    TemplateRef,
    WhatsappTemplate,
} from './organization.types';

interface ApiResponse<T>
{
    statusCode: number;
    message: string;
    data: T;
}

const data = <T>() => map((res: ApiResponse<T>) => res.data);

/**
 * Organisation de l'utilisateur connecte : adhesion (cachee), membres,
 * invitations, numero WhatsApp Business, modeles et boite de reception.
 *
 * `membership$` vaut `undefined` tant que l'adhesion n'est pas chargee, `null`
 * pour un compte personnel.
 */
@Injectable({ providedIn: 'root' })
export class OrganizationService
{
    private readonly _membership = new BehaviorSubject<Membership | null | undefined>(undefined);
    private readonly _baseUrl = `${environment.apiUrl}/organizations`;
    private _plans$: Observable<PlansCatalog> | null = null;

    constructor(private _http: HttpClient) {}

    get membership$(): Observable<Membership | null | undefined>
    {
        return this._membership.asObservable();
    }

    /** Adhesion une fois chargee (null : compte personnel). */
    get loadedMembership$(): Observable<Membership | null>
    {
        return this._membership.pipe(filter((value) => value !== undefined)) as Observable<Membership | null>;
    }

    get membership(): Membership | null | undefined
    {
        return this._membership.value;
    }

    /** Vrai si les envois passent par l'API WhatsApp Cloud de l'organisation. */
    get isMember(): boolean
    {
        return !!this._membership.value;
    }

    load(): Observable<Membership | null>
    {
        return this._http.get<ApiResponse<Membership | null>>(`${this._baseUrl}/me`).pipe(
            data<Membership | null>(),
            tap((membership) => this._membership.next(membership)),
            catchError(() => {
                // En cas d'erreur, on ne bloque pas l'application (compte personnel).
                if (this._membership.value === undefined) this._membership.next(null);
                return of(this._membership.value ?? null);
            }),
        );
    }

    reset(): void
    {
        this._membership.next(undefined);
    }

    // ------------------------------------------------------------ organisation

    plans(): Observable<PlansCatalog>
    {
        this._plans$ ??= this._http.get<ApiResponse<PlansCatalog>>(`${this._baseUrl}/plans`).pipe(
            data<PlansCatalog>(),
            shareReplay(1),
        );
        return this._plans$;
    }

    create(name: string, plan: string): Observable<Membership>
    {
        return this._http
            .post<ApiResponse<Membership>>(this._baseUrl, { name, plan })
            .pipe(data<Membership>(), tap((membership) => this._membership.next(membership)));
    }

    rename(name: string): Observable<Membership>
    {
        return this._http
            .patch<ApiResponse<Membership>>(`${this._baseUrl}/me`, { name })
            .pipe(data<Membership>(), tap((membership) => this._membership.next(membership)));
    }

    paySubscription(): Observable<Membership>
    {
        return this._http
            .post<ApiResponse<Membership>>(`${this._baseUrl}/me/subscription/pay`, {})
            .pipe(data<Membership>(), tap((membership) => this._membership.next(membership)));
    }

    leave(): Observable<unknown>
    {
        return this._http
            .post<ApiResponse<unknown>>(`${this._baseUrl}/me/leave`, {})
            .pipe(data<unknown>(), tap(() => this._membership.next(null)));
    }

    // ------------------------------------------------------------ membres

    members(): Observable<OrganizationMember[]>
    {
        return this._http.get<ApiResponse<OrganizationMember[]>>(`${this._baseUrl}/me/members`).pipe(data<OrganizationMember[]>());
    }

    changeRole(userId: string, role: OrgRole): Observable<unknown>
    {
        return this._http.put<ApiResponse<unknown>>(`${this._baseUrl}/me/members/${userId}/role`, { role }).pipe(data<unknown>());
    }

    removeMember(userId: string): Observable<unknown>
    {
        return this._http.delete<ApiResponse<unknown>>(`${this._baseUrl}/me/members/${userId}`).pipe(data<unknown>());
    }

    // ------------------------------------------------------------ invitations

    invitations(): Observable<OrganizationInvitation[]>
    {
        return this._http
            .get<ApiResponse<OrganizationInvitation[]>>(`${this._baseUrl}/me/invitations`)
            .pipe(data<OrganizationInvitation[]>());
    }

    invite(email: string, role: OrgRole): Observable<OrganizationInvitation>
    {
        return this._http
            .post<ApiResponse<OrganizationInvitation>>(`${this._baseUrl}/me/invitations`, { email, role })
            .pipe(data<OrganizationInvitation>());
    }

    resendInvitation(id: string): Observable<unknown>
    {
        return this._http.post<ApiResponse<unknown>>(`${this._baseUrl}/me/invitations/${id}/resend`, {}).pipe(data<unknown>());
    }

    revokeInvitation(id: string): Observable<unknown>
    {
        return this._http.delete<ApiResponse<unknown>>(`${this._baseUrl}/me/invitations/${id}`).pipe(data<unknown>());
    }

    previewInvitation(token: string): Observable<InvitationPreview>
    {
        return this._http
            .get<ApiResponse<InvitationPreview>>(`${environment.apiUrl}/invitations/${encodeURIComponent(token)}`)
            .pipe(data<InvitationPreview>());
    }

    acceptInvitation(token: string): Observable<Membership>
    {
        return this._http
            .post<ApiResponse<Membership>>(`${environment.apiUrl}/invitations/${encodeURIComponent(token)}/accept`, {})
            .pipe(data<Membership>(), tap((membership) => this._membership.next(membership)));
    }

    // ------------------------------------------------------------ WhatsApp Business

    whatsapp(): Observable<OrganizationWhatsapp>
    {
        return this._http.get<ApiResponse<OrganizationWhatsapp>>(`${this._baseUrl}/me/whatsapp`).pipe(data<OrganizationWhatsapp>());
    }

    connectEmbedded(code: string, wabaId: string, phoneNumberId: string): Observable<OrganizationWhatsapp>
    {
        return this._http
            .post<ApiResponse<OrganizationWhatsapp>>(`${this._baseUrl}/me/whatsapp/connect`, { code, wabaId, phoneNumberId })
            .pipe(data<OrganizationWhatsapp>(), tap(() => this.load().subscribe()));
    }

    refreshWhatsapp(): Observable<OrganizationWhatsapp>
    {
        return this._http
            .post<ApiResponse<OrganizationWhatsapp>>(`${this._baseUrl}/me/whatsapp/refresh`, {})
            .pipe(data<OrganizationWhatsapp>());
    }

    templates(approvedOnly = false): Observable<WhatsappTemplate[]>
    {
        const params = approvedOnly ? new HttpParams().set('approved', 'true') : undefined;
        return this._http
            .get<ApiResponse<WhatsappTemplate[]>>(`${this._baseUrl}/me/whatsapp/templates`, { params })
            .pipe(data<WhatsappTemplate[]>());
    }

    syncTemplates(): Observable<unknown>
    {
        return this._http.post<ApiResponse<unknown>>(`${this._baseUrl}/me/whatsapp/templates/sync`, {}).pipe(data<unknown>());
    }

    createTemplate(input: {
        name: string;
        language: string;
        category: string;
        body: string;
        bodyExamples?: string[];
        headerText?: string;
        footer?: string;
    }): Observable<WhatsappTemplate>
    {
        return this._http
            .post<ApiResponse<WhatsappTemplate>>(`${this._baseUrl}/me/whatsapp/templates`, input)
            .pipe(data<WhatsappTemplate>());
    }

    deleteTemplate(name: string): Observable<unknown>
    {
        return this._http
            .delete<ApiResponse<unknown>>(`${this._baseUrl}/me/whatsapp/templates/${encodeURIComponent(name)}`)
            .pipe(data<unknown>());
    }

    // ------------------------------------------------------------ boite de reception

    conversations(query: { page?: number; limit?: number; search?: string; unread?: boolean } = {}): Observable<{
        data: Conversation[];
        total: number;
        page: number;
        limit: number;
        unreadConversations: number;
    }>
    {
        let params = new HttpParams();
        if (query.page) params = params.set('page', query.page);
        if (query.limit) params = params.set('limit', query.limit);
        if (query.search) params = params.set('search', query.search);
        if (query.unread) params = params.set('unread', 'true');
        return this._http.get<ApiResponse<any>>(`${environment.apiUrl}/inbox/conversations`, { params }).pipe(data<any>());
    }

    conversationMessages(id: string, before?: string): Observable<{ conversation: Conversation; messages: InboxMessage[] }>
    {
        const params = before ? new HttpParams().set('before', before) : undefined;
        return this._http
            .get<ApiResponse<any>>(`${environment.apiUrl}/inbox/conversations/${id}/messages`, { params })
            .pipe(data<any>());
    }

    markConversationRead(id: string): Observable<unknown>
    {
        return this._http.post<ApiResponse<unknown>>(`${environment.apiUrl}/inbox/conversations/${id}/read`, {}).pipe(data<unknown>());
    }

    reply(id: string, input: { text?: string; template?: TemplateRef }): Observable<{ messageId: string; status: string }>
    {
        return this._http
            .post<ApiResponse<any>>(`${environment.apiUrl}/inbox/conversations/${id}/reply`, input)
            .pipe(data<any>());
    }

    mediaUrl(mediaId: string): string
    {
        return `${environment.apiUrl}/inbox/media/${encodeURIComponent(mediaId)}`;
    }

    media(mediaId: string): Observable<Blob>
    {
        return this._http.get(this.mediaUrl(mediaId), { responseType: 'blob' });
    }
}

/** Message d'erreur lisible depuis une reponse HTTP du backend. */
export const readApiError = (error: any, fallback = 'Une erreur est survenue'): string =>
{
    const message = error?.error?.message;
    return Array.isArray(message) ? message.join(', ') : (message || fallback);
};
