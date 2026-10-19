import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor
{
    constructor(
        private _authService: AuthService,
        private _router: Router
    )
    {
    }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>>
    {
        const token = this._authService.accessToken;
        let newRequest = request;

        if ( token )
        {
            newRequest = request.clone({
                setHeaders: {
                    Authorization: 'Bearer ' + token
                }
            });
        }

        return next.handle(newRequest).pipe(
            catchError((error) => {
                if ( error instanceof HttpErrorResponse && error.status === 401 )
                {
                    this._authService.signOut();
                    this._router.navigate(['/auth/sign-in']);
                }

                return throwError(error);
            })
        );
    }
}
