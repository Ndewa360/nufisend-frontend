import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleListDayComponent, DayPlanificationEntry } from './schedule-list-day.component';

describe('ScheduleListDayComponent', () => {
  let component: ScheduleListDayComponent;
  let fixture: ComponentFixture<ScheduleListDayComponent>;
  let element: HTMLElement;

  const entry: DayPlanificationEntry = {
    _id: 'p1',
    title: 'Relance clients',
    status: { label: 'Active', tone: 'ok' },
    times: [{ time: '09:00', state: 'launched' }, { time: '18:00', state: 'upcoming' }],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ScheduleListDayComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleListDayComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  it('shows the empty state when there is no entry for the day', () => {
    component.entries = [];
    fixture.detectChanges();
    expect(element.textContent).toContain('Aucune planification ce jour.');
  });

  it('labels a missed occurrence as not launched', () => {
    component.entries = [{ ...entry, times: [{ time: '12:00', state: 'missed' }] }];
    fixture.detectChanges();
    expect(element.textContent).toContain('Non lancé');
  });

  it('shows the title, the status and only the times of the day', () => {
    component.entries = [entry];
    fixture.detectChanges();
    const text = element.textContent;
    expect(text).toContain('Relance clients');
    expect(text).toContain('Active');
    expect(text).toContain('09:00');
    expect(text).toContain('18:00');
    expect(text).toContain('Lancé');
    expect(text).toContain('Prévu');
  });

  it('shows the error state with a retry action instead of an empty list', () => {
    component.loadError = true;
    component.entries = [];
    fixture.detectChanges();
    expect(element.textContent).toContain('Impossible de charger le calendrier');
    expect(element.textContent).not.toContain('Aucune planification ce jour.');
  });

  it('emits retry when the retry button is clicked', () => {
    component.loadError = true;
    fixture.detectChanges();
    const spy = spyOn(component.retry, 'emit');
    (element.querySelector('button') as HTMLButtonElement).click();
    expect(spy).toHaveBeenCalled();
  });
});
