import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { LegalIndexComponent, LegalLayoutComponent } from './legal-layout.component';
import {
    CookiesComponent,
    ExerciseRightsComponent,
    LegalNoticeComponent,
    PrivacyPolicyComponent,
    ProcessingAgreementComponent,
    TermsComponent,
} from './pages/legal-pages';

const routes: Routes = [
    {
        path     : '',
        component: LegalLayoutComponent,
        children : [
            { path: '', component: LegalIndexComponent, title: 'Informations légales - NufiSend' },
            { path: 'mentions-legales', component: LegalNoticeComponent, title: 'Mentions légales - NufiSend' },
            { path: 'confidentialite', component: PrivacyPolicyComponent, title: 'Politique de confidentialité - NufiSend' },
            { path: 'conditions-utilisation', component: TermsComponent, title: "Conditions générales d'utilisation - NufiSend" },
            { path: 'cookies', component: CookiesComponent, title: 'Cookies - NufiSend' },
            { path: 'sous-traitance', component: ProcessingAgreementComponent, title: 'Accord de sous-traitance - NufiSend' },
            { path: 'exercer-mes-droits', component: ExerciseRightsComponent, title: 'Exercer mes droits - NufiSend' },
            { path: '**', redirectTo: '' },
        ],
    },
];

@NgModule({
    declarations: [
        LegalLayoutComponent,
        LegalIndexComponent,
        LegalNoticeComponent,
        PrivacyPolicyComponent,
        TermsComponent,
        CookiesComponent,
        ProcessingAgreementComponent,
        ExerciseRightsComponent,
    ],
    imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LegalModule
{
}
