import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { ContactModel } from "./contact.model";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";

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
}