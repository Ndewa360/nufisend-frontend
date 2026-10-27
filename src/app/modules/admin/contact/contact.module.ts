import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactRoutingModule } from './contact-routing.module';
import { ListComponent } from './list/list.component';
import { SharedModule } from 'app/shared/shared.module';
import { DetailComponent } from './detail/detail.component';
import { AddComponent } from './add/add.component';
import { DatePickerModule } from 'app/shared/modules/date-picker.module';
import { ImportComponent } from './import/import.component';
import { MessagerieModule } from '../messagerie/messagerie.module';
import { SelectGroupComponent } from './components/select-group/select-group.component';
import { UploadFileComponent } from './components/upload-file/upload-file.component';
import { MatStepperModule } from '@angular/material/stepper';
import { PrevisualizeDataFileComponent } from './components/previsualize-data-file/previsualize-data-file.component';


@NgModule({
  declarations: [
    ListComponent,
    DetailComponent,
    AddComponent,
    ImportComponent,
    SelectGroupComponent,
    UploadFileComponent,
    PrevisualizeDataFileComponent
  ],
  imports: [
    CommonModule,
    ContactRoutingModule,
    MessagerieModule,
    MatStepperModule,

    SharedModule,
    DatePickerModule
  ]
})
export class ContactModule { }
