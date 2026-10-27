import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { ActivatedRoute } from '@angular/router';
import { FinanceApiService } from './finance-api.service';

/** Page "Finance" du super-administrateur. */
@Component({
    selector       : 'app-finance',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col flex-auto min-w-0">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent">
                <div>
                    <div class="text-2xl md:text-3xl font-extrabold tracking-tight">Finance</div>
                    <div class="text-secondary">Portefeuille de la plateforme, paiements Mobile Money et wallets clients.</div>
                </div>
                <button mat-stroked-button [routerLink]="['/super-admin/dashboard']">
                    <mat-icon svgIcon="heroicons_outline:arrow-left"></mat-icon><span class="ml-2">Administration</span>
                </button>
            </div>
            <div class="p-6 sm:p-10">
                <mat-tab-group animationDuration="0ms" [mat-stretch-tabs]="false" [selectedIndex]="tab" (selectedIndexChange)="tab = $event">
                    <mat-tab label="Vue d'ensemble"><ng-template matTabContent><div class="pt-6"><app-finance-overview></app-finance-overview></div></ng-template></mat-tab>
                    <mat-tab label="Paiements"><ng-template matTabContent><div class="pt-6"><app-finance-payments></app-finance-payments></div></ng-template></mat-tab>
                    <mat-tab label="Portefeuilles"><ng-template matTabContent><div class="pt-6"><app-finance-wallets></app-finance-wallets></div></ng-template></mat-tab>
                    <mat-tab label="Grand livre"><ng-template matTabContent><div class="pt-6"><app-finance-ledger></app-finance-ledger></div></ng-template></mat-tab>
                    <mat-tab label="Rapprochement"><ng-template matTabContent><div class="pt-6"><app-finance-reconciliation></app-finance-reconciliation></div></ng-template></mat-tab>
                    <mat-tab label="Tarifs & paramètres"><ng-template matTabContent><div class="pt-6"><app-finance-settings></app-finance-settings></div></ng-template></mat-tab>
                    <mat-tab label="Audit"><ng-template matTabContent><div class="pt-6"><app-finance-audit></app-finance-audit></div></ng-template></mat-tab>
                </mat-tab-group>
            </div>
        </div>
    `,
})
export class FinanceComponent
{
    private static readonly TABS = ['overview', 'payments', 'wallets', 'ledger', 'reconciliation', 'settings', 'audit'];
    tab = 0;

    constructor(route: ActivatedRoute)
    {
        // Onglet initial : /super-admin/finance?tab=wallets&user=<id>
        const index = FinanceComponent.TABS.indexOf(route.snapshot.queryParamMap.get('tab') || '');
        if (index >= 0) this.tab = index;
    }
}

/** Journal des actions financieres des administrateurs. */
@Component({
    selector       : 'app-finance-audit',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="bg-card rounded-2xl shadow">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm">
                    <thead class="bg-gray-50 dark:bg-black dark:bg-opacity-5 text-secondary">
                        <tr><th class="px-4 py-3">Date</th><th class="px-4 py-3">Administrateur</th><th class="px-4 py-3">Action</th><th class="px-4 py-3">Cible</th><th class="px-4 py-3">Détails</th></tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let log of logs" class="border-t align-top">
                            <td class="px-4 py-2 whitespace-nowrap">{{ log.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                            <td class="px-4 py-2">{{ log.actor?.email || 'système' }}</td>
                            <td class="px-4 py-2 whitespace-nowrap">{{ actions[log.action] || log.action }}</td>
                            <td class="px-4 py-2">{{ log.target }}</td>
                            <td class="px-4 py-2"><pre class="text-xs whitespace-pre-wrap">{{ log.details | json }}</pre></td>
                        </tr>
                        <tr *ngIf="!logs.length"><td colspan="5" class="px-4 py-8 text-center text-secondary">Aucune action enregistrée</td></tr>
                    </tbody>
                </table>
            </div>
            <mat-paginator [length]="total" [pageIndex]="page" [pageSize]="50" [hidePageSize]="true" (page)="onPage($event)"></mat-paginator>
        </div>
    `,
})
export class FinanceAuditComponent implements OnInit
{
    readonly actions: Record<string, string> = {
        'wallet.adjustment'      : 'Ajustement de wallet',
        'billing.settings.update': 'Modification des paramètres',
        'wallet.custom_pricing'  : 'Tarif négocié',
        'payment.recheck'        : 'Revérification de paiement',
        'platform.settlement'    : 'Reversement enregistré',
        'platform.reconciliation': 'Rapprochement manuel',
    };
    logs: any[] = [];
    total = 0;
    page = 0;

    constructor(private _api: FinanceApiService, private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void
    {
        this.load();
    }

    load(): void
    {
        this._api.audit({ page: this.page + 1, limit: 50 }).subscribe((res) => {
            this.logs = res.data;
            this.total = res.total;
            this._cdr.markForCheck();
        });
    }

    onPage(event: PageEvent): void
    {
        this.page = event.pageIndex;
        this.load();
    }
}
