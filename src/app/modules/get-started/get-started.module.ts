import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GetStartedRoutingModule } from './get-started-routing.module';
import { HomeComponent } from './home/home.component';
import { SharedModule } from 'app/shared/shared.module';


@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    GetStartedRoutingModule,
    SharedModule
  ]
})
export class GetStartedModule { }
