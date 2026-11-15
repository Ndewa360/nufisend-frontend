import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { PlanificationOccurrence, PlanificationOccurrencesItem, PlanificationState } from 'app/shared/store/planifcation';
import { PlanificationService } from 'app/shared/store/planifcation/planification.service';
import { ApexOptions } from 'ng-apexcharts';
import { Observable, Subject, Subscription, takeUntil } from 'rxjs';
import { DayPlanificationEntry, DayTimeSlot, OccurrenceState } from '../schedule-list-day/schedule-list-day.component';

/** Jours de la semaine : index 0 = lundi. */
export const DAY_LABELS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export type CalendarMode = 'week' | 'month';

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

/** Etat d'une occurrence, du point de vue de l'utilisateur. */
export const occurrenceStateOf = (item: PlanificationOccurrencesItem, occurrence: PlanificationOccurrence): OccurrenceState =>
{
  if (occurrence.launched === true) return 'launched';
  if (occurrence.launched === null || occurrence.launched === undefined) {
    // Trace inconnue : on ne sait pas si l'envoi a eu lieu. Jamais affiche comme "non lance".
    if (occurrence.past) return 'unknown';
  }
  if (!item.willRun) return 'not_sent';
  return occurrence.past ? 'missed' : 'upcoming';
};

/** Compteurs d'occurrences par etat, pour un jour. */
export interface DayCounts {
  upcoming: number;
  launched: number;
  missed: number;
  notSent: number;
}

/** Cellule de la grille mensuelle (null = case vide avant le 1er ou apres le dernier jour). */
export interface MonthCell {
  ymd: string;
  day: number;
}

/**
 * Grille mensuelle commencant le lundi : cases vides en debut de semaine, puis un jour par case.
 */
export function buildMonthGrid(year: number, month: number): (MonthCell | null)[]
{
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  const cells: (MonthCell | null)[] = Array(leading).fill(null);
  for (let day = 1; day <= lastDay; day++) {
    cells.push({ ymd: toYmd(new Date(year, month, day)), day });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss']
})
export class ScheduleComponent implements OnInit, OnDestroy {

  @Select(PlanificationState.selectStateData) planification$: Observable<unknown>;

  readonly dayLabels = DAY_LABELS;
  chartOptions: ApexOptions = {};

  mode: CalendarMode = 'week';
  /** Premier et dernier jour de la plage affichee (heure locale). */
  rangeStart: Date = new Date();
  rangeEnd: Date = new Date();
  /** Jour selectionne (YYYY-MM-DD) : detail affiche a droite. */
  selectedYmd = '';
  monthCells: (MonthCell | null)[] = [];
  /** Compteurs par jour (YYYY-MM-DD), pour la grille mensuelle. */
  dayCounts: Record<string, DayCounts> = {};
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

  get isWeek(): boolean
  {
    return this.mode === 'week';
  }

  /** Index (0 = lundi) du jour selectionne dans la semaine affichee. */
  get selectedDayIndex(): number
  {
    if (!this.selectedYmd) return 0;
    const [year, month, day] = this.selectedYmd.split('-').map(Number);
    const diff = Math.round((new Date(year, month - 1, day).getTime() - this.rangeStart.getTime()) / 86400000);
    return Math.min(6, Math.max(0, diff));
  }

  get selectedDayLabel(): string
  {
    if (!this.selectedYmd) return '';
    const [year, month, day] = this.selectedYmd.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get periodLabel(): string
  {
    if (this.isWeek) return '';
    return this.rangeStart.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  }

  ngOnInit(): void {
    this._setRange(new Date(), 'week');
    this._prepareChartOptions();

    // Recharge le calendrier a chaque changement des planifications (creation, modification,
    // changement d'organisation). La premiere emission declenche le chargement initial.
    this.planification$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(() => this.loadRange());
  }

  ngOnDestroy(): void {
    this._request?.unsubscribe();
    this._unsubscribeAll.next(undefined);
    this._unsubscribeAll.complete();
  }

  setMode(mode: CalendarMode): void
  {
    if (mode === this.mode) return;
    this._setRange(this.rangeStart, mode);
    this.loadRange();
  }

  goToToday(): void
  {
    this._setRange(new Date(), this.mode);
    this.loadRange();
  }

  prev(): void
  {
    this._shift(-1);
  }

  next(): void
  {
    this._shift(1);
  }

  selectDay(index: number): void
  {
    this.selectedYmd = toYmd(addDays(this.rangeStart, index));
    this._updateDayEntries();
  }

  selectDate(ymd: string): void
  {
    this.selectedYmd = ymd;
    this._updateDayEntries();
  }

  retry(): void
  {
    this.loadRange();
  }

  loadRange(): void
  {
    this._request?.unsubscribe();
    this.loading = true;
    this.loadError = false;
    this._request = this._planificationService
      .getOccurrences(toYmd(this.rangeStart), toYmd(this.rangeEnd))
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

  /**
   * Fixe la plage affichee. Semaine : lundi 00:00 a dimanche 23:59:59.999. Mois : 1er a dernier jour.
   * Le jour selectionne revient au premier jour de la plage (ou a aujourd'hui s'il y figure).
   */
  private _setRange(anchor: Date, mode: CalendarMode): void
  {
    this.mode = mode;
    if (mode === 'week') {
      const offsetToMonday = (anchor.getDay() + 6) % 7;
      this.rangeStart = addDays(anchor, -offsetToMonday);
      this.rangeEnd = new Date(this.rangeStart.getFullYear(), this.rangeStart.getMonth(), this.rangeStart.getDate() + 6, 23, 59, 59, 999);
    } else {
      this.rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1, 0, 0, 0, 0);
      this.rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0, 23, 59, 59, 999);
      this.monthCells = buildMonthGrid(anchor.getFullYear(), anchor.getMonth());
    }
    const today = toYmd(new Date());
    const todayInRange = today >= toYmd(this.rangeStart) && today <= toYmd(this.rangeEnd);
    this.selectedYmd = todayInRange ? today : toYmd(this.rangeStart);
  }

  private _shift(direction: number): void
  {
    const anchor = this.isWeek
      ? addDays(this.rangeStart, direction * 7)
      : new Date(this.rangeStart.getFullYear(), this.rangeStart.getMonth() + direction, 1);
    this._setRange(anchor, this.mode);
    this.selectedYmd = toYmd(this.rangeStart);
    this.loadRange();
  }

  private _refresh(): void
  {
    this._computeDayCounts();
    this._updateChart();
    this._updateDayEntries();
  }

  private _computeDayCounts(): void
  {
    const counts: Record<string, DayCounts> = {};
    this._items.forEach((item) => {
      item.occurrences.forEach((occurrence) => {
        const day = counts[occurrence.date] ?? (counts[occurrence.date] = { upcoming: 0, launched: 0, missed: 0, notSent: 0 });
        switch (occurrenceStateOf(item, occurrence)) {
          case 'launched': day.launched++; break;
          case 'missed': day.missed++; break;
          case 'upcoming': day.upcoming++; break;
          case 'not_sent': day.notSent++; break;
          default: break; // trace inconnue : exclue des compteurs
        }
      });
    });
    this.dayCounts = counts;
  }

  /** Quatre series par jour de la semaine, a partir des compteurs par date. */
  private _updateChart(): void
  {
    const upcoming = [0, 0, 0, 0, 0, 0, 0];
    const launched = [0, 0, 0, 0, 0, 0, 0];
    const missed = [0, 0, 0, 0, 0, 0, 0];
    const notSent = [0, 0, 0, 0, 0, 0, 0];

    Object.entries(this.dayCounts).forEach(([ymd, counts]) => {
      const index = weekdayIndexOf(ymd);
      upcoming[index] += counts.upcoming;
      launched[index] += counts.launched;
      missed[index] += counts.missed;
      notSent[index] += counts.notSent;
    });

    this.chartOptions = {
      ...this.chartOptions,
      series: [
        { name: 'Prévus', type: 'line', data: upcoming },
        { name: 'Lancés', type: 'line', data: launched },
        { name: 'Non lancés', type: 'line', data: missed },
        { name: 'Non envoyés', type: 'line', data: notSent },
      ],
    };
  }

  /** Planifications ayant une occurrence le jour selectionne, avec les heures de ce jour seulement. */
  private _updateDayEntries(): void
  {
    this.selectedDayEntries = this._items
      .map((item): DayPlanificationEntry | null => {
        const times: DayTimeSlot[] = item.occurrences
          .filter((occurrence) => occurrence.date === this.selectedYmd)
          .map((occurrence) => ({ time: occurrence.time, state: occurrenceStateOf(item, occurrence) }))
          .sort((a, b) => a.time.localeCompare(b.time));
        if (times.length === 0) return null;
        return { _id: item._id, title: item.title, status: this._statusOf(item), times };
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
      colors: ['#059669', '#2563eb', '#dc2626', '#f59e0b'],
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
      stroke: { width: [3, 2, 2, 2], dashArray: [0, 0, 0, 6] },
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
