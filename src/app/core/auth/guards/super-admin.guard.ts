import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild, Router, UrlTree } from '@angular/router';
import { Observable, map } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';

/**
 * Restreint l'acces a l'administration aux comptes ADMIN.
 *
 * L'utilisateur est charge via `check()` avant l'evaluation du role : apres un
 * rechargement de page, le profil n'est pas encore en memoire et un test
 * synchrone renverrait l'administrateur vers le tableau de bord.
 */
@Injectable({
    providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate, CanActivateChild
{
    constructor(
        private _authService: AuthService,
        private _router: Router
    )
    {
    }

    canActivate(): Observable<boolean | UrlTree>
    {
        return this._authService.check().pipe(
            map((authenticated) => {
                if ( authenticated && this._authService.user?.role === 'ADMIN' )
                {
                    return true;
                }
                return this._router.parseUrl(authenticated ? '/dashboard' : '/auth/sign-in');
            })
        );
    }

    canActivateChild(): Observable<boolean | UrlTree>
    {
        return this.canActivate();
    }
}
