import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { MatCalendar } from '@angular/material/datepicker';
import moment, { Moment } from 'moment';
import { NgxMaterialTimepickerTheme } from 'ngx-material-timepicker';
import { Subject, takeUntil } from 'rxjs';
import { PreferencesService } from 'app/shared/services/preferences/preferences.service';

/** Planification construite par le formulaire, au format attendu par le backend. */
export interface PlanificationDraft {
  hasPlanification: boolean;
  planif?: Record<string, unknown>[];
  /** Message d'erreur a afficher si la planification est incomplete. */
  error?: string;
}

/**
 * Heure de reference des dates du calendrier : midi local. Un jour calendaire envoye a midi
 * reste le meme jour dans le fuseau de la planification, quel que soit le fuseau du navigateur.
 */
const calendarDateToIso = (value: Moment): string => moment(value).hour(12).minute(0).second(0).millisecond(0).toISOString();

@Component({
  selector: 'app-planifier-date-envoi',
  templateUrl: './planifier-date-envoi.component.html',
  styleUrls: ['./planifier-date-envoi.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class PlanifierDateEnvoiComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('calendarCurrentDate') calendarCurrentDate: MatCalendar<Moment>;
  @Output() planficationDateEvent: EventEmitter<PlanificationDraft> = new EventEmitter<PlanificationDraft>();

  /** Bornes du calendrier : aujourd'hui jusqu'a la fin de l'annee suivante. */
  readonly minDate: Moment = moment().startOf('day');
  readonly maxDate: Moment = moment().add(1, 'year').endOf('year');

  planifForm: UntypedFormGroup;
  selectedDayOfWeek = 'Lundi';
  selectedMonthOfWeek = '';
  /** Date d'ancrage (mois / annee) : premiere occurrence. */
  selectedCurrentDate: Moment = moment().startOf('day');
  selectedRandomDate: string[] = [];
  /** Erreur de validation affichee sous le formulaire. */
  errorMessage = '';

  readonly listOfDay = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  readonly listOfMonth = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
  readonly timezone: string;

  readonly ngxMaterialTimePickerTheme: NgxMaterialTimepickerTheme = {
    container: { buttonColor: '#166534' },
    dial: { dialBackgroundColor: '#166534' },
    clockFace: { clockHandColor: '#166534' },
  };

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _formBuilder: UntypedFormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
    private _preferencesService: PreferencesService
  ) {
    this.timezone = this._preferencesService.get().timezone;
    this.selectedMonthOfWeek = this.listOfMonth[new Date().getMonth()];
  }

  ngAfterViewInit(): void {}

  ngOnInit(): void {
    this.planifForm = this._formBuilder.group({
      startAllPlage: [null],
      endAllPlage: [null],
      timeAllPlage: [''],
      isAllDayPlage: [false],
      isCurrentPlage: [false],
      numberOfCurrent: [1],
      timeCurrentPlage: [''],
      typeOfCurrent: ['day'],
      isRandomPlage: [false],
      timeRandomPlage: [''],
    });
    this.planifForm.valueChanges
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => this._emit());
    this._emit();
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  isRandomSelected(dateIso: string): boolean {
    return this.selectedRandomDate.includes(dateIso);
  }

  selectedRandomDateFunc = (date: Moment): string | null => (this.isRandomSelected(calendarDateToIso(date)) ? 'selected' : null);

  updateRandomDateSelected(date: Moment, calendar: MatCalendar<Moment>): void {
    const iso = calendarDateToIso(date);
    const index = this.selectedRandomDate.indexOf(iso);
    if (index < 0) this.selectedRandomDate = [...this.selectedRandomDate, iso].sort();
    else this.selectedRandomDate = this.selectedRandomDate.filter((_, i) => i !== index);
    calendar.updateTodaysDate();
    this._emit();
  }

  removeRandomDateSelected(dateIso: string, calendar: MatCalendar<Moment>): void {
    this.selectedRandomDate = this.selectedRandomDate.filter((date) => date !== dateIso);
    calendar.updateTodaysDate();
    this._emit();
  }

  /** Date ISO (midi local) affichee dans la liste des dates aleatoires. */
  formatRandomDate(dateIso: string): Date {
    return new Date(dateIso);
  }

  trackByFn(index: number, item: string): string {
    return item;
  }

  selectDay(value: string): void {
    this.selectedDayOfWeek = value;
    this._emit();
  }

  handleCurrentDateSelected(date: Moment): void {
    this.selectedCurrentDate = moment(date).startOf('day');
    this._emit();
  }

  selectCurrentMonth(value: string, index: number): void {
    this.selectedMonthOfWeek = value;
    // Le mois choisi decale simplement la vue du calendrier : l'occurrence est la date selectionnee.
    const viewDate = moment().year(this.maxDate.year()).month(index).startOf('month');
    this.calendarCurrentDate?._goToDateInView(viewDate, 'month');
    this._emit();
  }

  /** Construit la planification et la notifie au parent. */
  buildDraft(): PlanificationDraft {
    const value = this.planifForm.value;
    const today = moment().startOf('day');
    const planif: Record<string, unknown>[] = [];

    if (value.isAllDayPlage) {
      if (!value.startAllPlage || !value.endAllPlage) return this._invalid('Choisissez la plage de dates (début et fin).');
      if (!value.timeAllPlage) return this._invalid("Choisissez l'heure d'envoi de la plage.");
      if (moment(value.endAllPlage).isBefore(value.startAllPlage, 'day')) return this._invalid('La date de fin doit être après la date de début.');
      if (moment(value.endAllPlage).isBefore(today, 'day')) return this._invalid('La plage est entièrement passée.');
      planif.push({
        type: 'isAllDay',
        startDate: calendarDateToIso(moment(value.startAllPlage)),
        endDate: calendarDateToIso(moment(value.endAllPlage)),
        time: value.timeAllPlage,
        timezone: this.timezone,
      });
    }

    if (value.isCurrentPlage) {
      const every = Number(value.numberOfCurrent);
      if (!Number.isInteger(every) || every < 1) return this._invalid('La fréquence doit être un nombre entier au moins égal à 1.');
      if (!value.timeCurrentPlage) return this._invalid("Choisissez l'heure d'envoi récurrent.");
      const type = value.typeOfCurrent;
      if ((type === 'month' || type === 'year') && moment(this.selectedCurrentDate).isBefore(today, 'day')) {
        return this._invalid('La date de départ doit être aujourd\'hui ou plus tard.');
      }
      let obj: Record<string, unknown> = {
        type: 'isReccurent',
        time: value.timeCurrentPlage,
        every,
        recurency: type === 'week' ? 'week' : type === 'month' ? 'month' : type === 'year' ? 'year' : 'day',
        timezone: this.timezone,
      };
      if (type === 'week') obj = { ...obj, dayOfWeek: this.listOfDay.indexOf(this.selectedDayOfWeek) };
      if (type === 'month' || type === 'year') obj = { ...obj, date: calendarDateToIso(this.selectedCurrentDate) };
      planif.push(obj);
    }

    if (value.isRandomPlage) {
      if (!value.timeRandomPlage) return this._invalid("Choisissez l'heure d'envoi aléatoire.");
      if (this.selectedRandomDate.length === 0) return this._invalid('Sélectionnez au moins une date dans le calendrier.');
      if (this.selectedRandomDate.some((date) => moment(date).isBefore(today, 'day'))) {
        return this._invalid('Certaines dates sélectionnées sont passées.');
      }
      planif.push({
        type: 'isRandom',
        dates: this.selectedRandomDate,
        time: value.timeRandomPlage,
        timezone: this.timezone,
      });
    }

    if (planif.length === 0) return { hasPlanification: false };
    return { hasPlanification: true, planif };
  }

  private _invalid(error: string): PlanificationDraft {
    return { hasPlanification: false, error };
  }

  private _emit(): void {
    const draft = this.buildDraft();
    this.errorMessage = draft.error || '';
    this._changeDetectorRef.markForCheck();
    this.planficationDateEvent.emit(draft);
  }
}
