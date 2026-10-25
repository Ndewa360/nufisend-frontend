import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, CanActivateChild, CanLoad, Route, Router, RouterStateSnapshot, UrlSegment, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';

@Injectable({
    providedIn: 'root'
})
export class SuperAdminGuard implements CanActivate, CanActivateChild, CanLoad
{
    constructor(
        private _authService: AuthService,
        private _router: Router
    )
    {
    }

    private isSuperAdmin(): boolean
    {
        const user = this._authService.user;
        return !!(user && user['role'] === 'ADMIN');
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean
    {
        if (this.isSuperAdmin()) {
            return true;
        }
        this._router.navigate(['/dashboard']);
        return false;
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean
    {
        return this.canActivate(childRoute, state);
    }

    canLoad(route: Route, segments: UrlSegment[]): Observable<boolean> | Promise<boolean> | boolean
    {
        return this.isSuperAdmin();
    }
}
