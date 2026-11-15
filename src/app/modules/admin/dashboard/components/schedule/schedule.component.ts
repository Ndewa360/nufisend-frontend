import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { PlanificationOccurrencesItem, PlanificationState } from 'app/shared/store/planifcation';
import { PlanificationService } from 'app/shared/store/planifcation/planification.service';
import { ApexOptions } from 'ng-apexcharts';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { DayPlanificationEntry } from '../schedule-list-day/schedule-list-day.component';

/** Jours de la semaine : index 0 = lundi. */
const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

/** Date locale au format YYYY-MM-DD. */
export const toYmd = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** Ajoute des jours calendaires (heure locale remise a minuit). */
export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);

/** Index du jour de la semaine (0 = lundi) d'une date YYYY-MM-DD, independamment du fuseau du navigateur. */
export const weekdayIndexOf = (ymd: string): number =>
{
  const [year, month, day] = ymd.split('-').map(Number);
  return (new Date(Date.UTC(year, month - 1, day)).getUTCDay() + 6) % 7;
};

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit, OnDestroy {

  @Select(PlanificationState.selectStateData) planification$: Observable<unknown>;

  readonly dayLabels = DAY_LABELS;
  chartOptions: ApexOptions = {};

  /** Lundi 00:00 et dimanche 23:59:59.999 (heure locale) de la semaine affichee. */
  weekStart: Date = new Date();
  weekEnd: Date = new Date();

  selectedDayIndex = 0;
  selectedDayEntries: DayPlanificationEntry[] = [];

  loading = false;
  loadError = false;

  private _items: PlanificationOccurrencesItem[] = [];
  private _request: Subscription;
  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _router: Router,
    private _planificationService: PlanificationService,
  ) {}

  get selectedDayLabel(): string
  {
    return DAY_LABELS[this.selectedDayIndex];
  }

  ngOnInit(): void {
    this._setWeek(new Date());
    this._prepareChartOptions();

    // Recharge le calendrier a chaque changement des planifications (creation, modification,
    // changement d'organisation). La premiere emission declenche le chargement initial.
    this.planification$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => this.loadWeek());
  }

  ngOnDestroy(): void {
    this._request?.unsubscribe();
    this._unsubscribeAll.next(undefined);
    this._unsubscribeAll.complete();
  }

  prevWeekData(): void
  {
    this._shiftWeek(-7);
  }

  nextWeekData(): void
  {
    this._shiftWeek(7);
  }

  selectDay(index: number): void
  {
    this.selectedDayIndex = index;
    this._updateDayEntries();
  }

  retry(): void
  {
    this.loadWeek();
  }

  loadWeek(): void
  {
    this._request?.unsubscribe();
    this.loading = true;
    this.loadError = false;
    this._request = this._planificationService
      .getOccurrences(toYmd(this.weekStart), toYmd(this.weekEnd))
      .subscribe({
        next: (result) => {
          this._items = result?.data || [];
          this.loading = false;
          this._refresh();
        },
        error: () => {
          this._items = [];
          this.loading = false;
          this.loadError = true;
          this._refresh();
        }
      });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Private methods
  // -----------------------------------------------------------------------------------------------------

  /** Fixe la semaine : lundi 00:00 a dimanche 23:59:59.999, quelle que soit l'heure fournie. */
  private _setWeek(anchor: Date): void
  {
    const offsetToMonday = (anchor.getDay() + 6) % 7;
    this.weekStart = addDays(anchor, -offsetToMonday);
    this.weekEnd = new Date(this.weekStart.getFullYear(), this.weekStart.getMonth(), this.weekStart.getDate() + 6, 23, 59, 59, 999);
  }

  private _shiftWeek(days: number): void
  {
    this._setWeek(addDays(this.weekStart, days));
    // Le jour selectionne revient a lundi : sinon le surlignage ne correspond plus a la liste.
    this.selectedDayIndex = 0;
    this.loadWeek();
  }

  private _refresh(): void
  {
    this._updateChart();
    this._updateDayEntries();
  }

  /**
   * Trois series par jour de la semaine :
   * - envois prevus (planification active, solde suffisant, non epuisee, pas encore passee) ;
   * - envois passes (meme condition, heure deja atteinte) ;
   * - non envoyes (planification desactivee, suspendue ou epuisee).
   */
  private _updateChart(): void
  {
    const upcoming = [0, 0, 0, 0, 0, 0, 0];
    const past = [0, 0, 0, 0, 0, 0, 0];
    const notSent = [0, 0, 0, 0, 0, 0, 0];

    this._items.forEach((item) => {
      item.occurrences.forEach((occurrence) => {
        const index = weekdayIndexOf(occurrence.date);
        if (!item.willRun) notSent[index]++;
        else if (occurrence.past) past[index]++;
        else upcoming[index]++;
      });
    });

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        { name: 'Envois prévus', type: 'line', data: upcoming },
        { name: 'Envois passés', type: 'line', data: past },
        { name: 'Non envoyés', type: 'line', data: notSent },
      ],
      stroke: { width: [3, 2, 2], dashArray: [0, 0, 6] },
    };
  }

  /** Planifications ayant une occurrence le jour selectionne, avec les heures de ce jour seulement. */
  private _updateDayEntries(): void
  {
    const target = toYmd(addDays(this.weekStart, this.selectedDayIndex));
    this.selectedDayEntries = this._items
      .map((item): DayPlanificationEntry | null => {
        const times = item.occurrences
          .filter((occurrence) => occurrence.date === target)
          .map((occurrence) => ({ time: occurrence.time, past: occurrence.past }))
          .sort((a, b) => a.time.localeCompare(b.time));
        if (times.length === 0) return null;
        return {
          _id: item._id,
          title: item.title,
          status: this._statusOf(item),
          times,
        };
      })
      .filter((entry): entry is DayPlanificationEntry => entry !== null);
  }

  private _statusOf(item: PlanificationOccurrencesItem): DayPlanificationEntry['status']
  {
    if (!item.isActive) return { label: 'Désactivée', tone: 'muted' };
    if (item.billingStatus && item.billingStatus !== 'ok') return { label: 'Suspendue : solde insuffisant', tone: 'warn' };
    if (item.exhausted) return { label: 'Terminée', tone: 'muted' };
    return { label: 'Active', tone: 'ok' };
  }

  private _prepareChartOptions(): void
  {
    this.chartOptions = {
      chart: {
        fontFamily: 'inherit',
        foreColor: 'inherit',
        height: '100%',
        type: 'line',
        toolbar: { show: false },
        zoom: { enabled: false },
        id: 'planificationChart',
        // Correction du remplissage SVG (navigateurs avec <base>), appliquee a ce graphique uniquement.
        events: {
          mounted: (chart: any): void => this._fixSvgFill(chart.el),
          updated: (chart: any): void => this._fixSvgFill(chart.el),
        },
      },
      colors: ['#059669', '#64748B', '#f59e0b'],
      dataLabels: {
        enabled: true,
        enabledOnSeries: [0],
        background: { borderWidth: 0 },
      },
      grid: { borderColor: 'var(--fuse-border)' },
      labels: DAY_LABELS,
      legend: { show: true, position: 'bottom' },
      plotOptions: { bar: { columnWidth: '50%' } },
      series: [],
      states: { hover: { filter: { type: 'darken', value: 0.75 } } },
      stroke: { width: [3, 2, 2], dashArray: [0, 0, 6] },
      tooltip: { followCursor: true, theme: 'dark' },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { color: 'var(--fuse-border)' },
        labels: { style: { colors: 'var(--fuse-text-secondary)' } },
        tooltip: { enabled: false },
      },
      yaxis: {
        labels: {
          offsetX: -16,
          style: { colors: 'var(--fuse-text-secondary)' },
        },
      },
    };
  }

  private _fixSvgFill(element: Element): void
  {
    const currentURL = this._router.url;
    Array.from(element.querySelectorAll('*[fill]'))
      .filter((el) => el.getAttribute('fill').indexOf('url(') !== -1)
      .forEach((el) => {
        const attrVal = el.getAttribute('fill');
        el.setAttribute('fill', `url(${currentURL}${attrVal.slice(attrVal.indexOf('#'))}`);
      });
  }
}
