import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterModule, Routes } from "@angular/router";
import { SharedModule } from "app/shared/shared.module";
import { SettingsComponent } from "./settings.component";
import { PrivacySettingsComponent } from "./privacy/privacy-settings.component";
import { XafPipe } from "app/shared/pipes/xaf.pipe";

const routes: Routes = [
    {
        path: "",
        component: SettingsComponent
    },
    {
        path: "privacy",
        component: PrivacySettingsComponent
    }
];

@NgModule({
    declarations: [
        SettingsComponent,
        PrivacySettingsComponent
    ],
    imports: [
        CommonModule,
        SharedModule,
        XafPipe,
        RouterModule.forChild(routes)
    ]
})
export class SettingsModule
{
}
