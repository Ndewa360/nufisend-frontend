import { Component, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { Router } from '@angular/router';

@Component({
    selector     : 'auth-sign-in',
    templateUrl  : './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthSignInComponent
{
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    alert: { type: FuseAlertType; message: string } = {
        type   : 'error',
        message: ''
    };

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private _router: Router
    )
    {
    }

    ngOnInit(): void
    {
        this.signInForm = this._formBuilder.group({
            email     : ['', [Validators.required, Validators.email]],
            password  : ['', Validators.required]
        });
    }

    signIn(): void
    {
        if ( this.signInForm.invalid )
        {
            return;
        }

        this.showAlert = false;
        this._authService.signIn(this.signInForm.value)
            .subscribe({
                next: () => {
                    const redirectURL = this._router.parseUrl('/dashboard');
                    this._router.navigateByUrl('/dashboard');
                },
                error: (err) => {
                    this.alert = {
                        type   : 'error',
                        message: err?.error?.message || err?.message || 'Une erreur est survenue lors de la connexion.'
                    };
                    this.showAlert = true;
                }
            });
    }
}
