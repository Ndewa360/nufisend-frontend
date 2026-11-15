import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxsModule } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { of, throwError } from 'rxjs';
import { PlanificationOccurrencesItem, PlanificationState } from 'app/shared/store/planifcation';
import { PlanificationService } from 'app/shared/store/planifcation/planification.service';
import { addDays, buildMonthGrid, occurrenceStateOf, ScheduleComponent, toYmd, weekdayIndexOf } from './schedule.component';

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
        { date: mon, time: '09:00', planningIndex: 0, type: 'isReccurent', past: true, launched: true },
        { date: mon, time: '12:00', planningIndex: 1, type: 'isReccurent', past: true, launched: false },
        { date: mon, time: '18:00', planningIndex: 1, type: 'isReccurent', past: false, launched: false },
        { date: tue, time: '08:00', planningIndex: 0, type: 'isReccurent', past: false, launched: false },
      ],
    },
    {
      _id: 'pause', title: 'Desactivee', isActive: false, billingStatus: 'ok', exhausted: false, willRun: false,
      occurrences: [{ date: mon, time: '10:00', planningIndex: 0, type: 'isReccurent', past: false, launched: false }],
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

  it('classifies an occurrence: launched, missed, upcoming or not sent', () => {
    const active = { willRun: true } as PlanificationOccurrencesItem;
    const inactive = { willRun: false } as PlanificationOccurrencesItem;
    expect(occurrenceStateOf(active, { past: true, launched: true } as any)).toBe('launched');
    expect(occurrenceStateOf(active, { past: true, launched: false } as any)).toBe('missed');
    expect(occurrenceStateOf(active, { past: false, launched: false } as any)).toBe('upcoming');
    expect(occurrenceStateOf(inactive, { past: false, launched: false } as any)).toBe('not_sent');
    // Trace inconnue (anterieure a la mise en service) : jamais "non lance".
    expect(occurrenceStateOf(active, { past: true, launched: null } as any)).toBe('unknown');
  });

  it('builds a Monday-first month grid with leading blanks and every day once', () => {
    // Novembre 2026 : le 1er est un dimanche -> 6 cases vides avant le 1er.
    const cells = buildMonthGrid(2026, 10);
    expect(cells.slice(0, 6).every((cell) => cell === null)).toBe(true);
    expect(cells[6]).toEqual({ ymd: '2026-11-01', day: 1 });
    expect(cells.filter((cell) => cell !== null).length).toBe(30);
    expect(cells.length % 7).toBe(0);
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
    expect(component.rangeStart.getDay()).toBe(1);
    expect(component.rangeStart.getHours()).toBe(0);
    expect(component.rangeEnd.getDay()).toBe(0);
    expect(component.rangeEnd.getHours()).toBe(23);
    expect(component.rangeEnd.getMinutes()).toBe(59);
  });

  it('requests the occurrences of the displayed week', async () => {
    await create(() => of({ statusCode: 200, message: '', data: [] }));
    expect(getOccurrences).toHaveBeenCalledWith(toYmd(component.rangeStart), toYmd(component.rangeEnd));
  });

  it('splits the chart into upcoming, launched, missed and not sent occurrences per weekday', async () => {
    const monday = currentMonday();
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(monday) }));

    const [upcoming, launched, missed, notSent] = component.chartOptions.series as { data: number[] }[];
    expect(upcoming.data).toEqual([1, 1, 0, 0, 0, 0, 0]);
    expect(launched.data).toEqual([1, 0, 0, 0, 0, 0, 0]);
    expect(missed.data).toEqual([1, 0, 0, 0, 0, 0, 0]);
    expect(notSent.data).toEqual([1, 0, 0, 0, 0, 0, 0]);
  });

  it('lists only the times of the selected day with their state', async () => {
    const monday = currentMonday();
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(monday) }));

    component.selectDay(0);
    const entries = component.selectedDayEntries;
    expect(entries.map((entry) => entry.title)).toEqual(['Relance', 'Desactivee']);
    expect(entries[0].times).toEqual([
      { time: '09:00', state: 'launched' },
      { time: '12:00', state: 'missed' },
      { time: '18:00', state: 'upcoming' },
    ]);
    expect(entries[0].status.label).toBe('Active');
    expect(entries[1].status.label).toBe('Désactivée');
    expect(entries[1].times).toEqual([{ time: '10:00', state: 'not_sent' }]);

    component.selectDay(1);
    expect(component.selectedDayEntries.map((entry) => entry.title)).toEqual(['Relance']);
    expect(component.selectedDayEntries[0].times).toEqual([{ time: '08:00', state: 'upcoming' }]);
  });

  it('returns no entry for a day without occurrence', async () => {
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(currentMonday()) }));
    component.selectDay(3);
    expect(component.selectedDayEntries).toEqual([]);
  });

  it('resets the selected day to the first day of the range when moving to the next week', async () => {
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(currentMonday()) }));
    component.selectDay(4);
    component.next();
    expect(component.selectedDayIndex).toBe(0);
    expect(component.selectedYmd).toBe(toYmd(component.rangeStart));
  });

  it('switches to the month view and loads the whole month', async () => {
    await create(() => of({ statusCode: 200, message: '', data: [] }));
    component.setMode('month');
    expect(component.mode).toBe('month');
    expect(component.rangeStart.getDate()).toBe(1);
    expect(component.monthCells.filter((cell) => cell !== null).length).toBe(
      new Date(component.rangeStart.getFullYear(), component.rangeStart.getMonth() + 1, 0).getDate(),
    );
    expect(getOccurrences).toHaveBeenCalledWith(toYmd(component.rangeStart), toYmd(component.rangeEnd));
  });

  it('counts occurrences per day for the month grid', async () => {
    const monday = currentMonday();
    await create(() => of({ statusCode: 200, message: '', data: sampleItems(monday) }));
    component.setMode('month');
    const counts = component.dayCounts[toYmd(monday)];
    expect(counts).toEqual({ upcoming: 1, launched: 1, missed: 1, notSent: 1 });
  });

  it('flags a load error instead of showing an empty calendar', async () => {
    await create(() => throwError(() => new Error('network')));
    expect(component.loadError).toBe(true);
    expect(component.loading).toBe(false);
    expect(component.selectedDayEntries).toEqual([]);
  });
});
