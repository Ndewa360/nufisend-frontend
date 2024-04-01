import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';

import { ScheduleComponent } from './components/schedule/schedule.component';
import { HomeComponent } from './home/home.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { SharedModule } from 'app/shared/shared.module';
import { ScheduleListDayComponent } from './components/schedule-list-day/schedule-list-day.component';



@NgModule({
  declarations: [
    ScheduleComponent,
    ScheduleListDayComponent,
    HomeComponent,
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    NgApexchartsModule,
    SharedModule
  ]
})
export class DashboardModule { }
