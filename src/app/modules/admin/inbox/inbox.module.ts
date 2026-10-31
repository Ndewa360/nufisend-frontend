import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CloudTemplatePickerComponent } from 'app/shared/components/cloud-template-picker/cloud-template-picker.component';
import { SharedModule } from 'app/shared/shared.module';
import { organizationMemberGuard } from 'app/core/organization/organization.guard';
import { InboxComponent } from './inbox.component';

@NgModule({
    declarations: [InboxComponent],
    imports     : [
        SharedModule,
        CloudTemplatePickerComponent,
        RouterModule.forChild([{ path: '', canActivate: [organizationMemberGuard], component: InboxComponent }]),
    ],
})
export class InboxModule
{
}
