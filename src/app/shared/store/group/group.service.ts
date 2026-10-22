import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { HttpClient } from "@angular/common/http";
import { Observable, map } from "rxjs";
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
        return this._httpClient.get<ApiResultFormat<GroupModel[]>>(`${environment.apiUrl}/groups`).pipe(
            map((result) => ({ ...result, data: (result.data || []).map((group) => this.normalizeGroup(group)) }))
        )
    }

    /**
     * Create contact
     */
    createGroup(contact:GroupModel): Observable<ApiResultFormat<GroupModel>>
    {
        return this._httpClient.post<ApiResultFormat<GroupModel>>(`${environment.apiUrl}/groups`, contact).pipe(
            map((result) => ({ ...result, data: this.normalizeGroup(result.data) }))
        )
    }

    /**
     * Update contact
     */
    updateGroup(contact:GroupModel,id:string): Observable<ApiResultFormat<GroupModel>>
    {
        return this._httpClient.put<ApiResultFormat<GroupModel>>(`${environment.apiUrl}/groups/${id}`, contact).pipe(
            map((result) => ({ ...result, data: this.normalizeGroup(result.data) }))
        )
    }

    /**
     * Delete contact
     */
    deleteGroup(id:string): Observable<ApiResultFormat<null>>
    {
        return this._httpClient.delete<ApiResultFormat<null>>(`${environment.apiUrl}/groups/${id}`)
    }

    /**
     * The API populates contacts on list/detail responses, while the rest of the
     * frontend expects contact ids. Normalize both shapes here so every caller
     * gets a consistent GroupModel.
     */
    private normalizeGroup(group:any):GroupModel
    {
        if (!group) return group;
        return {
            ...group,
            contacts: (group.contacts || [])
                .map((contact:any) => typeof contact === "string" ? contact : contact?._id)
                .filter(Boolean)
        };
    }

}