import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApexOptions } from 'ng-apexcharts';
import { forkJoin } from 'rxjs';
import { FinanceApiService, FinanceOverview, PERIODS, periodQuery } from '../finance-api.service';

@Component({
    selector       : 'app-finance-overview',
    templateUrl    : './finance-overview.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinanceOverviewComponent implements OnInit
{
    readonly periods = PERIODS;
    period = '30d';
    overview: FinanceOverview | null = null;
    topCustomers: { userId: string; email: string; name: string; revenue: number; messages: number }[] = [];
    provider: { configured: boolean; balance: number | null; error: string | null } | null = null;
    chart: ApexOptions | null = null;
    loading = false;

    constructor(private _api: FinanceApiService, private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void
    {
        this.load();
        this._api.providerBalance().subscribe((provider) => {
            this.provider = provider;
            this._cdr.markForCheck();
        });
    }

    setPeriod(period: string): void
    {
        this.period = period;
        this.load();
    }

    load(): void
    {
        this.loading = true;
        const query = periodQuery(this.period);
        const granularity = this.period === '365d' || this.period === 'all' ? 'month' : 'day';
        forkJoin({
            overview: this._api.overview(query),
            series  : this._api.timeseries({ ...query, granularity }),
            top     : this._api.topCustomers({ ...query, limit: 10 }),
        }).subscribe({
            next : ({ overview, series, top }) => {
                this.overview = overview;
                this.topCustomers = top;
                this.chart = this._buildChart(series.points);
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this._cdr.markForCheck();
            },
        });
    }

    get providerGap(): number | null
    {
        if (!this.provider?.configured || this.provider.balance === null || !this.overview) return null;
        return this.provider.balance - this.overview.platformWallet.expectedProviderBalance;
    }

    private _buildChart(points: { bucket: string; topups: number; revenue: number; fees: number }[]): ApexOptions
    {
        return {
            chart     : { type: 'area', height: 320, toolbar: { show: false }, fontFamily: 'inherit', foreColor: 'inherit' },
            series    : [
                { name: 'Encaissements', data: points.map((p) => p.topups) },
                { name: "Chiffre d'affaires", data: points.map((p) => p.revenue) },
                { name: 'Frais Easy-Transact', data: points.map((p) => p.fees) },
            ],
            xaxis     : { categories: points.map((p) => p.bucket), labels: { rotate: -45 } },
            yaxis     : { labels: { formatter: (value) => `${Math.round(value).toLocaleString('fr-FR')}` } },
            dataLabels: { enabled: false },
            stroke    : { curve: 'smooth', width: 2 },
            colors    : ['#2563eb', '#16a34a', '#dc2626'],
            fill      : { type: 'gradient', gradient: { opacityFrom: 0.35, opacityTo: 0.05 } },
            tooltip   : { y: { formatter: (value) => `${Math.round(value).toLocaleString('fr-FR')} FCFA` } },
            legend    : { position: 'top' },
            noData    : { text: 'Aucune donnée sur la période' },
        };
    }
}
