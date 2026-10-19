import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FuseAlertModule } from '@fuse/components/alert';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';
import { authRoutes } from 'app/modules/auth/auth.routing';
import { AuthSignInComponent } from './sign-in/sign-in.component';
import { AuthSignUpComponent } from './sign-up/sign-up.component';

@NgModule({
    declarations: [
        AuthSignOutComponent,
        AuthSignInComponent,
        AuthSignUpComponent
    ],
    imports     : [
        RouterModule.forChild(authRoutes),
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        FuseAlertModule,
        FuseCardModule,
        SharedModule
    ]
})
export class AuthModule
{
}
