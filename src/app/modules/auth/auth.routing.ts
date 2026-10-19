import { Route } from '@angular/router';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { AuthSignInComponent } from 'app/modules/auth/sign-in/sign-in.component';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';
import { AuthSignUpComponent } from 'app/modules/auth/sign-up/sign-up.component';
import { AuthForgotPasswordComponent } from 'app/modules/auth/forgot-password/forgot-password.component';
import { AuthResetPasswordComponent } from 'app/modules/auth/reset-password/reset-password.component';
import { AuthConfirmEmailComponent } from 'app/modules/auth/confirm-email/confirm-email.component';

export const authRoutes: Route[] = [
    {
        path     : 'sign-in',
        canMatch : [NoAuthGuard],
        component: AuthSignInComponent
    },
    {
        path     : 'sign-up',
        canMatch : [NoAuthGuard],
        component: AuthSignUpComponent
    },
    {
        path     : 'forgot-password',
        canMatch : [NoAuthGuard],
        component: AuthForgotPasswordComponent
    },
    {
        path     : 'reset-password',
        canMatch : [NoAuthGuard],
        component: AuthResetPasswordComponent
    },
    {
        path     : 'confirm-email',
        canMatch : [NoAuthGuard],
        component: AuthConfirmEmailComponent
    },
    {
        path     : 'sign-out',
        component: AuthSignOutComponent
    },
    {
        path     : '**',
        redirectTo: 'sign-in'
    }
];
