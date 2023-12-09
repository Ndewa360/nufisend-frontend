import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, ReplaySubject, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { KeycloakProfile } from 'keycloak-js';

@Injectable({
    providedIn: 'root'
})
export class UserService
{
    private _user: ReplaySubject<KeycloakProfile> = new ReplaySubject<KeycloakProfile>(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient,private authService:AuthService)
    {
        this.authService.currentUser.subscribe((value)=>this.user=value)
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: KeycloakProfile)
    {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<KeycloakProfile>
    {
        return this._user.asObservable();
    }

}
