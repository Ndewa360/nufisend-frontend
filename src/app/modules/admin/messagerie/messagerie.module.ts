import { NgModule } from '@angular/core';
import { CloudTemplatePickerComponent } from 'app/shared/components/cloud-template-picker/cloud-template-picker.component';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';

import { MessagerieRoutingModule } from './messagerie-routing.module';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SharedModule } from 'app/shared/shared.module';
import { FuseCardModule } from '@fuse/components/card';
import { NewMessageComponent } from './new-message/new-message.component';
import { SelectContactsGroupsComponent } from './components/select-contacts-groups/select-contacts-groups.component';
import { SelectMessageTypeComponent } from './components/select-message-type/select-message-type.component';
import { PlanifierDateEnvoiComponent } from './components/planifier-date-envoi/planifier-date-envoi.component';
import { RedigerMessageComponent } from './components/rediger-message/rediger-message.component';
import { RedigerMessageDirectComponent } from './components/rediger-message-direct/rediger-message-direct.component';
import { RedigerMessagePlanifierComponent } from './components/rediger-message-planifier/rediger-message-planifier.component';
import { DatePickerModule } from 'app/shared/modules/date-picker.module';
import { RichTextEditorModule } from 'app/shared/modules/rich-text-editor.module';
import { NewMessageForSingleContactComponent } from './components/new-message-for-single-contact/new-message-for-single-contact.component';
import { PrevisualisationMessageContactComponent } from './components/previsualisation-message-contact/previsualisation-message-contact.component';
import { HomePlanningListComponent } from './components/home-planning-list/home-planning-list.component';
import { MessageCostEstimateComponent } from './components/message-cost-estimate/message-cost-estimate.component';
import { XafPipe } from 'app/shared/pipes/xaf.pipe';


@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent,
    NewMessageComponent,
    SelectContactsGroupsComponent,
    SelectMessageTypeComponent,
    PlanifierDateEnvoiComponent,
    RedigerMessageComponent,
    RedigerMessageDirectComponent,
    RedigerMessagePlanifierComponent,
    NewMessageForSingleContactComponent,
    PrevisualisationMessageContactComponent,
    HomePlanningListComponent,
    MessageCostEstimateComponent
  ],
  imports: [
    CommonModule,
    MessagerieRoutingModule,
    FuseCardModule,
    MatStepperModule,
    SharedModule,
    DatePickerModule,
    RichTextEditorModule,
    XafPipe,
    CloudTemplatePickerComponent,
  ],
  exports:[
    NewMessageForSingleContactComponent
  ]
})
export class MessagerieModule { }
