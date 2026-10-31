import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector     : 'auth-sign-up',
    templateUrl  : './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations   : fuseAnimations
})
export class AuthSignUpComponent implements OnInit, OnDestroy
{
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;
    hidePassword: boolean = true;
    hideConfirmPassword: boolean = true;
    alert: { type: FuseAlertType; message: string } = {
        type   : 'error',
        message: ''
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _authService: AuthService,
        private _router: Router,
        private _route: ActivatedRoute
    )
    {
    }

    ngOnInit(): void
    {
        this.signUpForm = this._formBuilder.group({
            firstName      : ['', Validators.required],
            lastName       : ['', Validators.required],
            email          : [this._route.snapshot.queryParamMap.get('email') || '', [Validators.required, Validators.email]],
            password       : ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    signUp(): void
    {
        if ( this.signUpForm.invalid )
        {
            this.signUpForm.markAllAsTouched();
            return;
        }

        const { confirmPassword, ...payload } = this.signUpForm.value;

        if ( confirmPassword !== payload.password )
        {
            this.alert = {
                type   : 'error',
                message: 'Les mots de passe ne correspondent pas.'
            };
            this.showAlert = true;
            this.signUpForm.get('confirmPassword').reset();
            return;
        }

        this.signUpForm.disable();
        this.showAlert = false;

        this._authService.signUp(payload)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    const redirectURL = this._route.snapshot.queryParamMap.get('redirectURL');
                    this._router.navigate(['/auth/sign-in'], {
                        queryParams: { registered: payload.email, ...(redirectURL ? { redirectURL } : {}) },
                    });
                },
                error: (err) => {
                    this.signUpForm.enable();

                    const msg = err?.error?.message;
                    this.alert = {
                        type   : 'error',
                        message: Array.isArray(msg) ? msg[0] : (msg || "Une erreur est survenue lors de l'inscription.")
                    };
                    this.showAlert = true;
                }
            });
    }
}
