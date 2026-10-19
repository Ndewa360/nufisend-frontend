import { Injectable } from '@angular/core';
import { CanMatch, Route, Router, UrlSegment, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class NoAuthGuard implements CanMatch
{
    constructor(
        private _authService: AuthService,
        private _router: Router
    )
    {
    }

    canMatch(route: Route, segments: UrlSegment[]): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        return this._check();
    }

    private _check(): Observable<boolean | UrlTree>
    {
        return this._authService.check().pipe(
            switchMap((authenticated) => {
                if ( authenticated )
                {
                    return of(this._router.parseUrl('/dashboard'));
                }
                return of(true);
            })
        );
    }
}
