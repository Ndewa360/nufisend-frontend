import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector     : 'auth-sign-in',
    templateUrl  : './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthSignInComponent implements OnInit, OnDestroy
{
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    hidePassword: boolean = true;
    alert: { type: FuseAlertType; message: string } = {
        type   : 'error',
        message: ''
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

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
            email   : ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    signIn(): void
    {
        if ( this.signInForm.invalid )
        {
            this.signInForm.markAllAsTouched();
            return;
        }

        this.signInForm.disable();
        this.showAlert = false;

        this._authService.signIn(this.signInForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    this._router.navigateByUrl('/dashboard');
                },
                error: (err) => {
                    this.signInForm.enable();
                    this.signInForm.get('password').reset();

                    const msg = err?.error?.message;
                    this.alert = {
                        type   : 'error',
                        message: Array.isArray(msg) ? msg[0] : (msg || 'Email ou mot de passe incorrect.')
                    };
                    this.showAlert = true;
                }
            });
    }
}
