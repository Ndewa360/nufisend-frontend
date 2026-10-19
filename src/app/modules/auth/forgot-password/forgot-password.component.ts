import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector     : 'auth-forgot-password',
    templateUrl  : './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthForgotPasswordComponent implements OnInit, OnDestroy
{
    forgotPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;
    submitted: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type   : 'success',
        message: ''
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService
    )
    {
    }

    ngOnInit(): void
    {
        this.forgotPasswordForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    send(): void
    {
        if ( this.forgotPasswordForm.invalid )
        {
            this.forgotPasswordForm.markAllAsTouched();
            return;
        }

        this.forgotPasswordForm.disable();
        this.showAlert = false;

        this._authService.forgotPassword(this.forgotPasswordForm.get('email').value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.submitted = true;
                    this.alert = {
                        type   : 'success',
                        message: response.message || 'Si un compte existe pour cet email, un lien de réinitialisation a été envoyé.'
                    };
                    this.showAlert = true;
                },
                error: () => {
                    this.forgotPasswordForm.enable();
                    this.alert = {
                        type   : 'error',
                        message: "Une erreur est survenue. Veuillez réessayer."
                    };
                    this.showAlert = true;
                }
            });
    }
}
