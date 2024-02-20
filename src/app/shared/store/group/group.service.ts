import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";
import { GroupModel } from "./group.model";

@Injectable({
    providedIn:'root'
})
export class GroupService
{
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}
    /**
     * Get groups
     */
    getGroups(): Observable<ApiResultFormat<GroupModel[]>>
    {
        return this._httpClient.get<ApiResultFormat<GroupModel[]>>(`${environment.apiUrl}/groups`)
    }

    /**
     * Create contact
     */
    createGroup(contact:GroupModel): Observable<ApiResultFormat<GroupModel>>
    {
        return this._httpClient.post<ApiResultFormat<GroupModel>>(`${environment.apiUrl}/groups`, contact)
    }

    /**
     * Update contact
     */
    updateGroup(contact:GroupModel,id:string): Observable<ApiResultFormat<GroupModel>>
    {
        return this._httpClient.put<ApiResultFormat<GroupModel>>(`${environment.apiUrl}/groups/${id}`, contact)
    }

    /**
     * Delete contact
     */
    deleteGroup(id:string): Observable<ApiResultFormat<null>>
    {
        return this._httpClient.delete<ApiResultFormat<null>>(`${environment.apiUrl}/groups/${id}`)
    }

    /**
     * Sync contact
     */
    syncGroups(): Observable<ApiResultFormat<null>>
    {
        return this._httpClient.post<ApiResultFormat<null>>(`${environment.apiUrl}/groups/sync-whatsapp`,{})
    }
}