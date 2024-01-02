import { Injectable } from "@angular/core";
import { environment } from "environments/environment";
import { UserProfileModel } from "./user-profile.model";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ApiResultFormat } from "../global";

@Injectable({
    providedIn:'root'
})
export class UserProfileService
{
    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}
    /**
     * Get user profile
     */
    getUserProfile(email): Observable<ApiResultFormat<UserProfileModel>>
    {
        return this._httpClient.get<ApiResultFormat<UserProfileModel>>(`${environment.apiUrl}/user/profil/${email}`)
    }

    /**
     * Update contact
     */
    updateUserProfile(contact:UserProfileModel,id:string): Observable<ApiResultFormat<UserProfileModel>>
    {
        return this._httpClient.put<ApiResultFormat<UserProfileModel>>(`${environment.apiUrl}/user/profile/${id}`, contact)
    }

}