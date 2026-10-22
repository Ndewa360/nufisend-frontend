import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { ContactModel } from "./contact.model";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";

export interface ContactImportResult {
    total:number;
    created:number;
    updated:number;
    skipped:number;
}

@Injectable({
    providedIn:'root'
})
export class ContactService
{
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}
    /**
     * Get contacts
     */
    getContacts(): Observable<ApiResultFormat<ContactModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<ContactModel[]>>(`${environment.apiUrl}/contacts`)
    }

    /**
     * Create contact
     */
    createContact(contact:ContactModel): Observable<ApiResultFormat<ContactModel>>
    {
        return this._httpClient.post<ApiResultFormat<ContactModel>>(`${environment.apiUrl}/contacts`, contact)
    }

    /**
     * Update contact
     */
    updateContact(contact:ContactModel,id:string): Observable<ApiResultFormat<ContactModel>>
    {
        return this._httpClient.put<ApiResultFormat<ContactModel>>(`${environment.apiUrl}/contacts/${id}`, contact)
    }

    /**
     * Delete contact
     */
    deleteContact(id:string): Observable<ApiResultFormat<null>>
    {
        return this._httpClient.delete<ApiResultFormat<null>>(`${environment.apiUrl}/contacts/${id}`)
    }

    /**
     * Sync contact
     */
    syncContacts(): Observable<ApiResultFormat<null>>
    {
        return this._httpClient.post<ApiResultFormat<null>>(`${environment.apiUrl}/contacts/sync-whatsapp`,{})
    }

    /**
     * Import contacts from a CSV file
     */
    importContacts(file: File): Observable<ApiResultFormat<ContactImportResult>>
    {
        const formData = new FormData();
        formData.append('files', file, file.name);
        return this._httpClient.post<ApiResultFormat<ContactImportResult>>(`${environment.apiUrl}/contacts/import`, formData)
    }
}