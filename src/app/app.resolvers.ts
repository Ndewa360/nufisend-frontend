import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable, map, of, switchMap } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';
import { OrganizationService } from 'app/core/organization/organization.service';

@Injectable({
    providedIn: 'root'
})
export class InitialDataResolver implements Resolve<Navigation>
{
    constructor(
        private _navigationService: NavigationService,
        private _organizationService: OrganizationService,
        private _authService: AuthService
    )
    {
    }

    /** Menu adapte au profil : l'adhesion a une organisation est chargee une fois par session. */
    resolve(): Observable<Navigation>
    {
        const membership = this._organizationService.membership;
        const membership$ = membership === undefined
            ? this._organizationService.load()
            : of(membership);
        return membership$.pipe(
            map((loaded) => ({
                isSuperAdmin: this._authService.user?.['role'] === 'ADMIN',
                isMember    : !!loaded,
            })),
            switchMap((access) => this._navigationService.get(access)),
        );
    }
}
