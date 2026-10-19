import { Route } from '@angular/router';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { AuthSignInComponent } from 'app/modules/auth/sign-in/sign-in.component';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';
import { AuthSignUpComponent } from 'app/modules/auth/sign-up/sign-up.component';

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
        path     : 'sign-out',
        component: AuthSignOutComponent
    },
    {
        path     : '**',
        redirectTo: 'sign-in'
    }
];
