import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { SharedModule } from "app/shared/shared.module";
import { OrganisationRoutingModule } from "./organisation.routing";
import { OrganisationUsersComponent } from "./users/users.component";
import { OrganisationSettingsComponent } from "./settings/settings.component";

@NgModule({
    declarations: [
        OrganisationUsersComponent,
        OrganisationSettingsComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        OrganisationRoutingModule
    ]
})
export class OrganisationModule
{
}
