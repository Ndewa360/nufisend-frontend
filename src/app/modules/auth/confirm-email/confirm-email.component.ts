import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector     : 'auth-confirm-email',
    templateUrl  : './confirm-email.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthConfirmEmailComponent implements OnInit, OnDestroy
{
    loading: boolean = true;
    emailConfirmed: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type   : 'error',
        message: ''
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _authService: AuthService,
        private _route: ActivatedRoute
    )
    {
    }

    ngOnInit(): void
    {
        const token = this._route.snapshot.queryParamMap.get('token') || '';

        if ( !token )
        {
            this.loading = false;
            this.alert = {
                type   : 'error',
                message: 'Lien de confirmation invalide ou expiré.'
            };
            return;
        }

        this._authService.confirmEmail(token)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.loading = false;
                    this.emailConfirmed = true;
                    this.alert = {
                        type   : 'success',
                        message: response.message || 'Votre adresse email a bien été confirmée.'
                    };
                },
                error: (err) => {
                    this.loading = false;
                    const msg = err?.error?.message;
                    this.alert = {
                        type   : 'error',
                        message: Array.isArray(msg) ? msg[0] : (msg || 'Lien de confirmation invalide ou expiré.')
                    };
                }
            });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
