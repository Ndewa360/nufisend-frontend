import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanMatch, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanMatch
{
    constructor(
        private _authService: AuthService,
        private _router: Router
    )
    {
    }

    canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        return this._check(segments);
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        return this._check(state.url ? state.url.split('/') : []);
    }

    private _check(url: string[] | UrlSegment[] | string): Observable<boolean | UrlTree>
    {
        return this._authService.check().pipe(
            switchMap((authenticated) => {
                if ( authenticated )
                {
                    return of(true);
                }

                let redirectURL = '/';
                if ( Array.isArray(url) )
                {
                    redirectURL = url.map((u) => (typeof u === 'string' ? u : (u as UrlSegment).path)).join('/');
                }
                else if ( typeof url === 'string' )
                {
                    redirectURL = url;
                }

                const queryParams: any = {};
                if ( redirectURL && redirectURL !== '/' )
                {
                    queryParams.redirectURL = redirectURL;
                }

                return of(this._router.createUrlTree(['/auth/sign-in'], { queryParams }));
            })
        );
    }
}
