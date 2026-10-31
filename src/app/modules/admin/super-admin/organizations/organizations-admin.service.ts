import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { Observable, map } from 'rxjs';
import { Organization, OrganizationWhatsapp, OrgRole } from 'app/core/organization/organization.types';

interface ApiResponse<T>
{
    statusCode: number;
    message: string;
    data: T;
}

export interface AdminOrganizationRow
{
    _id: string;
    name: string;
    plan: string;
    status: 'active' | 'suspended';
    createdAt: string;
    subscription?: Organization['subscription'];
    whatsapp?: Partial<OrganizationWhatsapp>;
    membersCount: number;
    available: number;
    reserved: number;
    owner?: { _id: string; email: string; firstName?: string; lastName?: string };
}

export interface AdminOrganizationDetails
{
    organization: Organization;
    members: { userId: string; email: string; name: string; role: OrgRole; joinedAt: string }[];
    maxMembers: number;
}

export interface AdminOrganizationUpdate
{
    status?: 'active' | 'suspended';
    suspensionReason?: string;
    plan?: string;
    maxMembers?: number | null;
    monthlyPrice?: number;
}

export interface ManualConnection
{
    wabaId: string;
    phoneNumberId: string;
    accessToken: string;
    register?: boolean;
    pin?: string;
}

/** Organisations vues par le super-admin (offre, suspension, raccordement du numero). */
@Injectable({ providedIn: 'root' })
export class OrganizationsAdminService
{
    private readonly _baseUrl = `${environment.apiUrl}/admin/organizations`;

    constructor(private _http: HttpClient) {}

    list(query: { page?: number; limit?: number; search?: string; status?: string; whatsapp?: string } = {}): Observable<{
        data: AdminOrganizationRow[];
        total: number;
        page: number;
        limit: number;
    }>
    {
        let params = new HttpParams();
        Object.entries(query).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') params = params.set(key, String(value));
        });
        return this._http.get<ApiResponse<any>>(this._baseUrl, { params }).pipe(map((res) => res.data));
    }

    get(id: string): Observable<AdminOrganizationDetails>
    {
        return this._http.get<ApiResponse<AdminOrganizationDetails>>(`${this._baseUrl}/${id}`).pipe(map((res) => res.data));
    }

    update(id: string, input: AdminOrganizationUpdate): Observable<AdminOrganizationDetails>
    {
        return this._http.patch<ApiResponse<AdminOrganizationDetails>>(`${this._baseUrl}/${id}`, input).pipe(map((res) => res.data));
    }

    whatsapp(id: string): Observable<OrganizationWhatsapp>
    {
        return this._http.get<ApiResponse<OrganizationWhatsapp>>(`${this._baseUrl}/${id}/whatsapp`).pipe(map((res) => res.data));
    }

    connect(id: string, input: ManualConnection): Observable<OrganizationWhatsapp>
    {
        return this._http.post<ApiResponse<OrganizationWhatsapp>>(`${this._baseUrl}/${id}/whatsapp`, input).pipe(map((res) => res.data));
    }

    refresh(id: string): Observable<OrganizationWhatsapp>
    {
        return this._http.post<ApiResponse<OrganizationWhatsapp>>(`${this._baseUrl}/${id}/whatsapp/refresh`, {}).pipe(map((res) => res.data));
    }

    disconnect(id: string): Observable<unknown>
    {
        return this._http.delete<ApiResponse<unknown>>(`${this._baseUrl}/${id}/whatsapp`).pipe(map((res) => res.data));
    }
}
