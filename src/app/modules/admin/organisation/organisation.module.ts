import { PersonalDataTransferComponent } from 'app/shared/components/personal-data-transfer/personal-data-transfer.component';
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "app/shared/shared.module";
import { XafPipe } from "app/shared/pipes/xaf.pipe";
import { OrganisationRoutingModule } from "./organisation.routing";
import { OrganisationSettingsComponent } from "./settings/settings.component";
import { OrganisationOverviewComponent } from "./overview/overview.component";
import { OrganisationMembersComponent } from "./members/members.component";
import { OrganisationWhatsappComponent } from "./whatsapp/whatsapp-business.component";

@NgModule({
    declarations: [
        OrganisationOverviewComponent,
        OrganisationMembersComponent,
        OrganisationWhatsappComponent,
        OrganisationSettingsComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        XafPipe,
        PersonalDataTransferComponent,
        OrganisationRoutingModule
    ]
})
export class OrganisationModule
{
}
