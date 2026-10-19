import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector     : 'auth-reset-password',
    templateUrl  : './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthResetPasswordComponent implements OnInit, OnDestroy
{
    resetPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    hidePassword: boolean = true;
    hideConfirmPassword: boolean = true;
    token: string = '';
    completed: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type   : 'error',
        message: ''
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private _route: ActivatedRoute,
        private _router: Router
    )
    {
    }

    ngOnInit(): void
    {
        this.token = this._route.snapshot.queryParamMap.get('token') || '';

        this.resetPasswordForm = this._formBuilder.group({
            password       : ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        });

        if ( !this.token )
        {
            this.alert = {
                type   : 'error',
                message: 'Lien de réinitialisation invalide ou expiré.'
            };
            this.showAlert = true;
        }
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    resetPassword(): void
    {
        if ( this.resetPasswordForm.invalid || !this.token )
        {
            this.resetPasswordForm.markAllAsTouched();
            return;
        }

        const { password, confirmPassword } = this.resetPasswordForm.value;

        if ( password !== confirmPassword )
        {
            this.alert = {
                type   : 'error',
                message: 'Les mots de passe ne correspondent pas.'
            };
            this.showAlert = true;
            this.resetPasswordForm.get('confirmPassword').reset();
            return;
        }

        this.resetPasswordForm.disable();
        this.showAlert = false;

        this._authService.resetPassword({ token: this.token, password })
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.completed = true;
                    this.alert = {
                        type   : 'success',
                        message: response.message || 'Votre mot de passe a bien été réinitialisé.'
                    };
                    this.showAlert = true;
                },
                error: (err) => {
                    this.resetPasswordForm.enable();
                    const msg = err?.error?.message;
                    this.alert = {
                        type   : 'error',
                        message: Array.isArray(msg) ? msg[0] : (msg || 'Lien invalide ou expiré.')
                    };
                    this.showAlert = true;
                }
            });
    }

    goToSignIn(): void
    {
        this._router.navigateByUrl('/auth/sign-in');
    }
}
