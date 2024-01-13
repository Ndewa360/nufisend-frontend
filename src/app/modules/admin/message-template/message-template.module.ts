import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageTemplateRoutingModule } from './message-template-routing.module';
import { ListComponent } from './list/list.component';
import { SharedModule } from 'app/shared/shared.module';
import { AddComponent } from './add/add.component';
import { QuillModule } from 'ngx-quill';
import { DetailComponent } from './detail/detail.component';


@NgModule({
  declarations: [
    ListComponent,
    AddComponent,
    DetailComponent
  ],
  imports: [
    CommonModule,
    MessageTemplateRoutingModule,
    SharedModule,
    QuillModule.forRoot(),

  ]
})
export class MessageTemplateModule { }
