import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { PlanificationOccurrencesItem, PlanificationState } from 'app/shared/store/planifcation';
import { PlanificationService } from 'app/shared/store/planifcation/planification.service';
import { addDays, ScheduleComponent, toYmd, weekdayIndexOf } from './schedule.component';

/** Lundi de la semaine courante, pour que les occurrences tombent dans la semaine affichee. */
const currentMonday = (): Date =>
{
  const today = new Date();
  return addDays(today, -((today.getDay() + 6) % 7));
};

const sampleItems = (monday: Date): PlanificationOccurrencesItem[] =>
{
  const mon = toYmd(monday);
  const tue = toYmd(addDays(monday, 1));
  return [
    {
      _id: 'relance', title: 'Relance', isActive: true, billingStatus: 'ok', exhausted: false, willRun: true,
      occurrences: [
        { date: mon, time: '09:00', planningIndex: 0, type: 'isReccurent', past: true },
        { date: mon, time: '18:00', planningIndex: 1, type: 'isReccurent', past: false },
        { date: tue, time: '08:00', planningIndex: 0, type: 'isReccurent', past: false },
      ],
    },
    {
      _id: 'pause', title: 'Desactivee', isActive: false, billingStatus: 'ok', exhausted: false, willRun: false,
      occurrences: [{ date: mon, time: '10:00', planningIndex: 0, type: 'isReccurent', past: false }],
    },
  ];
};

describe('schedule helpers', () => {
  it('maps weekdays to an index where 0 is Monday', () => {
    expect(weekdayIndexOf('2026-11-09')).toBe(0); // lundi
    expect(weekdayIndexOf('2026-11-14')).toBe(5); // samedi
    expect(weekdayIndexOf('2026-11-15')).toBe(6); // dimanche
  });

  it('formats local dates as YYYY-MM-DD', () => {
    expect(toYmd(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});

describe('ScheduleComponent', () => {
  let component: ScheduleComponent;
  let fixture: ComponentFixture<ScheduleComponent>;
  let getOccurrences: jasmine.Spy;

  const create = async (response: () => any) =>
  {
    getOccurrences = jasmine.createSpy('getOccurrences').and.callFake(response);
    await TestBed.configureTestingModule({
      declarations: [ScheduleComponent],
      imports: [
        RouterTestingModule,
        NgxsModule.forRoot([PlanificationState]),
      ],
      providers: [
        { provide: PlanificationService, useValue: { getOccurrences } },
        { provide: ToastrService, useValue: { error: () => undefined } },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  it('builds the week from Monday 00:00 to Sunday 23:59:59.999', async () => {
    await create(() => of({ statusCode: 200, message: '', data: [] }));
    expect(component.weekStart.getDay()).toBe(1);
    expect(component.weekStart.getHours()).toBe(0);
    expect(component.weekEnd.getDay()).toBe(0);
    expect(component.weekEnd.getHours()).toBe(23);
    expect(component.weekEnd.getMinutes()).toBe(59);
  });

  it('requests the occurrences of the displayed week', async () => {
    await create(() => of({ statusCode: 200, message: '', data: [] }));
    expect(getOccurrences).toHaveBeenCalledWith(toYmd(component.weekStart), toYmd(component.weekEnd));
  });

  it('splits the chart into upcoming, past and not sent occurrences per weekday', async () => {
    const monday = currentMonday();
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(monday) }));

    const [upcoming, past, notSent] = component.chartOptions.series as { data: number[] }[];
    expect(upcoming.data).toEqual([1, 1, 0, 0, 0, 0, 0]);
    expect(past.data).toEqual([1, 0, 0, 0, 0, 0, 0]);
    expect(notSent.data).toEqual([1, 0, 0, 0, 0, 0, 0]);
  });

  it('lists only the times of the selected day', async () => {
    const monday = currentMonday();
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(monday) }));

    component.selectDay(0);
    const monday_ = component.selectedDayEntries;
    expect(monday_.map((entry) => entry.title)).toEqual(['Relance', 'Desactivee']);
    expect(monday_[0].times).toEqual([{ time: '09:00', past: true }, { time: '18:00', past: false }]);
    expect(monday_[0].status.label).toBe('Active');
    expect(monday_[1].status.label).toBe('Désactivée');

    component.selectDay(1);
    expect(component.selectedDayEntries.map((entry) => entry.title)).toEqual(['Relance']);
    expect(component.selectedDayEntries[0].times).toEqual([{ time: '08:00', past: false }]);
  });

  it('returns no entry for a day without occurrence', async () => {
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(currentMonday()) }));
    component.selectDay(3);
    expect(component.selectedDayEntries).toEqual([]);
  });

  it('resets the selected day to Monday when the week changes', async () => {
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(currentMonday()) }));
    component.selectDay(4);
    component.nextWeekData();
    expect(component.selectedDayIndex).toBe(0);
    expect(component.selectedDayLabel).toBe('Lundi');
  });

  it('flags a load error instead of showing an empty calendar', async () => {
    await create(() => throwError(() => new Error('network')));
    expect(component.loadError).toBe(true);
    expect(component.loading).toBe(false);
    expect(component.selectedDayEntries).toEqual([]);
  });
});
