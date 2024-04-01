import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScheduleListDayComponent } from './schedule-list-day.component';

describe('ScheduleListDayComponent', () => {
  let component: ScheduleListDayComponent;
  let fixture: ComponentFixture<ScheduleListDayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ScheduleListDayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScheduleListDayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
