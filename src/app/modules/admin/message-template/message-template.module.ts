import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MessageTemplateRoutingModule } from './message-template-routing.module';
import { ListComponent } from './list/list.component';
import { SharedModule } from 'app/shared/shared.module';
import { AddComponent } from './add/add.component';
import { RichTextEditorModule } from 'app/shared/modules/rich-text-editor.module';
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
    RichTextEditorModule,

  ]
})
export class MessageTemplateModule { }
