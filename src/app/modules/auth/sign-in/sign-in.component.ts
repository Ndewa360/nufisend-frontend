import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
    showResendConfirmation: boolean = false;
    resendConfirmationSent: boolean = false;
    hidePassword: boolean = true;
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
        this.signInForm = this._formBuilder.group({
            email   : ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });

        const registered = this._route.snapshot.queryParamMap.get('registered');
        if ( registered )
        {
            this.signInForm.get('email').setValue(registered);
            this.alert = {
                type   : 'success',
                message: 'Votre compte a été créé. Veuillez confirmer votre adresse email avant de vous connecter.'
            };
            this.showAlert = true;
        }
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
        this.showResendConfirmation = false;
        this.resendConfirmationSent = false;

        this._authService.signIn(this.signInForm.value)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    // Retour sur la page demandee (ex. lien d'invitation), chemins internes uniquement.
                    const redirectURL = this._route.snapshot.queryParamMap.get('redirectURL') || '';
                    const internal = redirectURL.startsWith('/') && !redirectURL.startsWith('//');
                    this._router.navigateByUrl(internal ? redirectURL : '/dashboard');
                },
                error: (err) => {
                    this.signInForm.enable();
                    this.signInForm.get('password').reset();

                    const msg = err?.error?.message;
                    this.showResendConfirmation = err?.error?.error === 'EMAIL_NOT_CONFIRMED';
                    this.alert = {
                        type   : 'error',
                        message: Array.isArray(msg) ? msg[0] : (msg || 'Email ou mot de passe incorrect.')
                    };
                    this.showAlert = true;
                }
            });
    }

    resendConfirmation(): void
    {
        const email = this.signInForm.get('email').value;
        if ( !email )
        {
            return;
        }

        this._authService.resendConfirmation(email)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: () => {
                    this.resendConfirmationSent = true;
                }
            });
    }
}
