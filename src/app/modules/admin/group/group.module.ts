import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GroupRoutingModule } from './group-routing.module';
import { ListComponent } from './list/list.component';
import { AddComponent } from './add/add.component';
import { DetailComponent } from './detail/detail.component';
import { SharedModule } from 'app/shared/shared.module';
import { SelectContactComponent } from './components/select-contact/select-contact.component';


@NgModule({
  declarations: [
    ListComponent,
    AddComponent,
    DetailComponent,
    SelectContactComponent
  ],
  imports: [
    CommonModule,
    GroupRoutingModule,
    SharedModule
  ]
})
export class GroupModule { }
