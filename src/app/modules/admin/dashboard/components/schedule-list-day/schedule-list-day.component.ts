import { Component, Input } from '@angular/core';
import { PlanificationModel } from 'app/shared/store/planifcation';

@Component({
  selector: 'app-schedule-list-day',
  templateUrl: './schedule-list-day.component.html',
  styleUrls: ['./schedule-list-day.component.scss']
})
export class ScheduleListDayComponent {
  @Input() planingList:PlanificationModel[]=[]

  getTime()
  {
    
  }
}
