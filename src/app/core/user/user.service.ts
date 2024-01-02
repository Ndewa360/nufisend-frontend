import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, ReplaySubject, tap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { KeycloakProfile } from 'keycloak-js';
import { Store } from '@ngxs/store';
import { UserProfileAction } from 'app/shared/store/user-profile';

@Injectable({
    providedIn: 'root'
})
export class UserService
{
    private _user: ReplaySubject<KeycloakProfile> = new ReplaySubject<KeycloakProfile>(1);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient,private authService:AuthService,private _store:Store)
    {
        this.authService.currentUser.subscribe((value)=>{
            this.user=value;
            if(value) this._store.dispatch(new UserProfileAction.FetchUserProfile(value.email))
        })
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
    goToUserProfile()
    {
        return this.authService.redirectToProfile()
    }

}
