import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ApexOptions } from 'ng-apexcharts';
import { Subject, Subscription, takeUntil } from 'rxjs';
import { CampaignStats, CampaignStatsService } from 'app/shared/store/message';

/** Periodes proposees : nombre de jours se terminant aujourd'hui. */
export const OVERVIEW_PERIODS = [7, 30, 90] as const;
export type OverviewPeriod = (typeof OVERVIEW_PERIODS)[number];

/**
 * Apercu des campagnes : indicateurs de la periode, activite par jour.
 * Les chiffres viennent de /message/stats (envois reels, pas de planifications).
 */
@Component({
  selector: 'app-campaign-overview',
  templateUrl: './campaign-overview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignOverviewComponent implements OnInit, OnDestroy {
  readonly periods = OVERVIEW_PERIODS;
  period: OverviewPeriod = 30;
  stats: CampaignStats | null = null;
  loading = false;
  error = false;
  chartOptions: ApexOptions = {};

  private _request: Subscription;
  private _unsubscribeAll = new Subject<void>();

  constructor(private _statistics: CampaignStatsService, private _cdr: ChangeDetectorRef) {
    this._prepareChart();
  }

  get hasActivity(): boolean {
    return !!this.stats && this.stats.totals.total > 0;
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this._request?.unsubscribe();
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  setPeriod(period: OverviewPeriod): void {
    if (period === this.period) return;
    this.period = period;
    this.load();
  }

  /** Rechargement (apres un envoi, ou a la demande). */
  load(): void {
    this._request?.unsubscribe();
    const to = new Date();
    const from = new Date(to.getTime() - this.period * 86400000);
    this.loading = true;
    this.error = false;
    this._cdr.markForCheck();
    this._request = this._statistics.stats(from, to).pipe(takeUntil(this._unsubscribeAll)).subscribe({
      next: (stats) => {
        this.stats = stats;
        this.loading = false;
        this.chartOptions = {
          ...this.chartOptions,
          series: this._series(stats),
          xaxis: { ...this.chartOptions.xaxis, categories: stats.byDay.map((day) => this._label(day.date)) },
        };
        this._cdr.markForCheck();
      },
      error: () => {
        this.stats = null;
        this.loading = false;
        this.error = true;
        this._cdr.markForCheck();
      },
    });
  }

  /** 2026-11-15 -> 15/11 (libelle court de l'axe). */
  private _label(date: string): string {
    const [, month, day] = date.split('-');
    return `${day}/${month}`;
  }

  private _series(stats: CampaignStats): ApexOptions['series'] {
    const days = stats.byDay;
    return [
      { name: 'Livrés', type: 'bar', data: days.map((day) => day.delivered) },
      { name: 'Sans accusé', type: 'bar', data: days.map((day) => day.unconfirmed) },
      { name: 'Échecs', type: 'bar', data: days.map((day) => day.failed) },
    ] as ApexOptions['series'];
  }

  private _prepareChart(): void {
    this.chartOptions = {
      chart: { type: 'bar', stacked: true, height: 260, toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'inherit' },
      colors: ['#059669', '#f59e0b', '#dc2626'],
      plotOptions: { bar: { columnWidth: '60%' } },
      dataLabels: { enabled: false },
      legend: { position: 'bottom' },
      xaxis: { categories: [], labels: { rotate: -45, style: { colors: 'var(--fuse-text-secondary)' } } },
      yaxis: { labels: { style: { colors: 'var(--fuse-text-secondary)' } } },
      grid: { borderColor: 'var(--fuse-border)' },
      tooltip: { theme: 'dark' },
      series: [],
    };
  }
}
