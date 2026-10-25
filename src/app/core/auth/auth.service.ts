import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';
import { environment } from 'environments/environment';
import { ApiResultFormat } from 'app/shared/store/global';
import { UserService } from 'app/core/user/user.service';
import { Store } from '@ngxs/store';

export interface User {
    _id?: string;
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    country?: string;
    location?: string;
    phoneNumber?: string;
    hasSyncWhatsApp?: boolean;
    emailConfirmed?: boolean;
    role?: string;
    permissions?: string;
    isBlocked?: boolean;
    createdAt?: Date;
}

export interface AuthResponse {
    accessToken: string;
    expiresIn: string;
    user: User;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService
{
    private _authenticated: boolean = false;
    private _user: User | null = null;

    constructor(
        private _httpClient: HttpClient,
        private _userService: UserService,
        private _store: Store
    )
    {
        this.check();
    }

    set accessToken(token: string)
    {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string
    {
        return localStorage.getItem('accessToken') ?? '';
    }

    get authenticated(): boolean
    {
        return this._authenticated;
    }

    get user(): User | null
    {
        return this._user;
    }

    set user(value: User | null)
    {
        this._user = value;
    }

    signIn(credentials: { email: string; password: string }): Observable<AuthResponse>
    {
        if ( this._authenticated )
        {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post<ApiResultFormat<AuthResponse>>(`${environment.apiUrl}/auth/login`, credentials).pipe(
            switchMap((response) => {
                this.accessToken = response.data.accessToken;
                this._authenticated = true;
                this._user = response.data.user;
                this._userService.user = response.data.user;
                return of(response.data);
            })
        );
    }

    signUp(user: { firstName: string; lastName: string; email: string; password: string; country?: string; location?: string; phoneNumber?: string }): Observable<ApiResultFormat<{ user: User }>>
    {
        return this._httpClient.post<ApiResultFormat<{ user: User }>>(`${environment.apiUrl}/auth/register`, user);
    }

    forgotPassword(email: string): Observable<ApiResultFormat<{ message: string }>>
    {
        return this._httpClient.post<ApiResultFormat<{ message: string }>>(`${environment.apiUrl}/auth/forgot-password`, { email });
    }

    resetPassword(payload: { token: string; password: string }): Observable<ApiResultFormat<{ message: string }>>
    {
        return this._httpClient.post<ApiResultFormat<{ message: string }>>(`${environment.apiUrl}/auth/reset-password`, payload);
    }

    changePassword(payload: { currentPassword: string; newPassword: string }): Observable<ApiResultFormat<{ message: string }>>
    {
        return this._httpClient.post<ApiResultFormat<{ message: string }>>(`${environment.apiUrl}/auth/change-password`, payload);
    }

    confirmEmail(token: string): Observable<ApiResultFormat<{ message: string }>>
    {
        return this._httpClient.post<ApiResultFormat<{ message: string }>>(`${environment.apiUrl}/auth/confirm-email`, { token });
    }

    resendConfirmation(email: string): Observable<ApiResultFormat<{ message: string }>>
    {
        return this._httpClient.post<ApiResultFormat<{ message: string }>>(`${environment.apiUrl}/auth/resend-confirmation`, { email });
    }

    signOut(): Observable<boolean>
    {
        localStorage.removeItem('accessToken');
        this._authenticated = false;
        this._user = null;
        this._userService.user = null;
        // Reset all NGXS states so no data leaks to the next user session
        this._store.reset({
            contacts:         { contacts: [], loadingContacts: false, initLoadingState: 'NO_LOADED' },
            groups:           { groups: [], loadingGroups: false, initLoadingState: 'NO_LOADED' },
            userprofile:      { userProfile: null, loadingUserProfile: false },
            globals:          { isLoading: false, isConnectedToWhatsapp: false, whatsappSyncStatus: 'unknown', whatsappSyncProgress: 0, whatsappSyncMessage: null, notifications: [] },
            whatsapp_contacts:{ contacts: [], startLoading: false, percentLoading: 0, syncError: null },
            messageTemplates: { messageTemplates: [], loadingMessageTemplates: false, initLoadingState: 'NO_LOADED' },
            message:          { sendingMessage: false },
            planifications:   { planifications: [], loadingPlanifications: false, initLoadingState: 'NO_LOADED' },
        });
        return of(true);
    }

    signInUsingToken(): Observable<boolean>
    {
        return this._httpClient.get<ApiResultFormat<User>>(`${environment.apiUrl}/auth/me`).pipe(
            catchError(() => of(false)),
            switchMap((response: ApiResultFormat<User> | false) => {
                if ( !response )
                {
                    localStorage.removeItem('accessToken');
                    this._authenticated = false;
                    this._user = null;
                    return of(false);
                }

                this._authenticated = true;
                this._user = response.data;
                this._userService.user = response.data;
                return of(true);
            })
        );
    }

    check(): Observable<boolean>
    {
        if ( this._authenticated )
        {
            return of(true);
        }

        if ( !this.accessToken )
        {
            return of(false);
        }

        return this.signInUsingToken();
    }
}
