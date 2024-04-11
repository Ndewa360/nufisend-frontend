import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { FuseCardModule } from '@fuse/components/card';
import { SharedModule } from 'app/shared/shared.module';
import { AuthSignOutComponent } from 'app/modules/auth/sign-out/sign-out.component';
import { authRoutes } from 'app/modules/auth/auth.routing';
import { SignInupComponent } from './sign-inup/sign-inup.component';

@NgModule({
    declarations: [
        AuthSignOutComponent,
        SignInupComponent
    ],
    imports     : [
        RouterModule.forChild(authRoutes),
        MatButtonModule,
        FuseCardModule,
        SharedModule
    ]
})
export class AuthModule
{
}
