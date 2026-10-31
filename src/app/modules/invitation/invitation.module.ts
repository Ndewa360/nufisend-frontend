import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { InvitationComponent } from './invitation.component';

@NgModule({
    declarations: [InvitationComponent],
    imports     : [
        SharedModule,
        RouterModule.forChild([{ path: '', component: InvitationComponent }]),
    ],
})
export class InvitationModule
{
}
