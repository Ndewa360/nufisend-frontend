import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { OrganisationUsersComponent } from "./users/users.component";
import { OrganisationSettingsComponent } from "./settings/settings.component";

const routes: Routes = [
    {
        path: "",
        pathMatch: "full",
        redirectTo: "users"
    },
    {
        path: "users",
        component: OrganisationUsersComponent
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
