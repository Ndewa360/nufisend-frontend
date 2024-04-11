import { Route } from '@angular/router';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';
import { SignInupComponent } from './sign-inup/sign-inup.component';

export const authRoutes: Route[] = [
    {
        path     : 'sign-out',
        component: AuthSignOutComponent
    },
    {
        path     : 'sign-in',
        component: SignInupComponent
    }
];
