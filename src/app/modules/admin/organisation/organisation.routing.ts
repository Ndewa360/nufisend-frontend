import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { organizationMemberGuard } from "app/core/organization/organization.guard";
import { OrganisationOverviewComponent } from "./overview/overview.component";
import { OrganisationMembersComponent } from "./members/members.component";
import { OrganisationWhatsappComponent } from "./whatsapp/whatsapp-business.component";
import { OrganisationSettingsComponent } from "./settings/settings.component";

const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        redirectTo: "overview"
    },
    {
        path: "overview",
        component: OrganisationOverviewComponent
    },
    {
        path: "members",
        canActivate: [organizationMemberGuard],
        component: OrganisationMembersComponent
    },
    {
        path: "whatsapp",
        canActivate: [organizationMemberGuard],
        component: OrganisationWhatsappComponent
    },
    {
        // Ancienne page « Utilisateurs ».
        path: "users",
        redirectTo: "members"
    },
    {
        path: "settings",
        component: OrganisationSettingsComponent
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class OrganisationRoutingModule
{
}
