import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ContactRoutingModule } from './contact-routing.module';
import { ListComponent } from './list/list.component';
import { SharedModule } from 'app/shared/shared.module';
import { DetailComponent } from './detail/detail.component';
import { AddComponent } from './add/add.component';
import { MAT_DATE_FORMATS } from '@angular/material/core';


@NgModule({
  declarations: [
    ListComponent,
    DetailComponent,
    AddComponent
  ],
  imports: [
    CommonModule,
    ContactRoutingModule,
    SharedModule
  ],
  providers   : [
    {
        provide : MAT_DATE_FORMATS,
        useValue: {
            parse  : {
                dateInput: 'D'
            },
            display: {
                dateInput         : 'DDD',
                monthYearLabel    : 'LLL yyyy',
                dateA11yLabel     : 'DD',
                monthYearA11yLabel: 'LLLL yyyy'
            }
        }
    }
]
})
export class ContactModule { }
