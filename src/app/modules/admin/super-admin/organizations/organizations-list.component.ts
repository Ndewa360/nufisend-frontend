import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { readApiError } from 'app/core/organization/organization.service';
import { PLAN_LABELS, SUBSCRIPTION_LABELS } from 'app/core/organization/organization.types';
import { ToastrService } from 'ngx-toastr';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AdminOrganizationRow, OrganizationsAdminService } from './organizations-admin.service';

/** Liste des organisations (super-admin). */
@Component({
    selector       : 'app-organizations-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col flex-auto min-w-0 p-6 sm:p-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div class="text-3xl font-bold tracking-tight">Organisations</div>
                    <div class="mt-1 text-secondary">{{ total }} organisation(s) · WhatsApp Business, abonnements et portefeuilles.</div>
                </div>
                <a mat-stroked-button routerLink="/super-admin/dashboard">
                    <mat-icon svgIcon="heroicons_outline:arrow-left"></mat-icon><span class="ml-2">Administration</span>
                </a>
            </div>

            <div class="flex flex-col md:flex-row gap-4 mt-6">
                <mat-form-field class="flex-auto" appearance="outline" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="icon-size-5" svgIcon="heroicons_outline:search"></mat-icon>
                    <input matInput [(ngModel)]="search" (ngModelChange)="search$.next()" placeholder="Nom de l'organisation">
                </mat-form-field>
                <mat-form-field class="md:w-52" appearance="outline" subscriptSizing="dynamic">
                    <mat-label>Statut</mat-label>
                    <mat-select [(ngModel)]="status" (ngModelChange)="reload(1)">
                        <mat-option value="">Tous</mat-option>
                        <mat-option value="active">Actives</mat-option>
                        <mat-option value="suspended">Suspendues</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-form-field class="md:w-60" appearance="outline" subscriptSizing="dynamic">
                    <mat-label>Numéro WhatsApp</mat-label>
                    <mat-select [(ngModel)]="whatsapp" (ngModelChange)="reload(1)">
                        <mat-option value="">Tous</mat-option>
                        <mat-option value="not_connected">À raccorder</mat-option>
                        <mat-option value="connected">Raccordés</mat-option>
                        <mat-option value="error">En erreur</mat-option>
                    </mat-select>
                </mat-form-field>
            </div>

            <div class="bg-card rounded-2xl shadow overflow-hidden mt-6">
                <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead class="bg-gray-50 dark:bg-transparent text-secondary text-sm">
                            <tr>
                                <th class="px-4 py-3">Organisation</th>
                                <th class="px-4 py-3">Offre / abonnement</th>
                                <th class="px-4 py-3">WhatsApp</th>
                                <th class="px-4 py-3 text-right">Membres</th>
                                <th class="px-4 py-3 text-right">Solde</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let row of rows" class="border-t cursor-pointer hover:bg-gray-50 dark:hover:bg-hover"
                                [routerLink]="['/super-admin/organizations', row._id]">
                                <td class="px-4 py-3">
                                    <div class="font-medium">{{ row.name }}
                                        <span *ngIf="row.status === 'suspended'" class="ml-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">Suspendue</span>
                                    </div>
                                    <div class="text-sm text-secondary">{{ row.owner?.email }} · {{ row.createdAt | date:'dd/MM/yyyy' }}</div>
                                </td>
                                <td class="px-4 py-3">
                                    <div>{{ planLabels[row.plan] || row.plan }}</div>
                                    <div class="text-sm text-secondary">{{ subscriptionLabels[row.subscription?.status] || '—' }}</div>
                                </td>
                                <td class="px-4 py-3">
                                    <span class="px-2 py-0.5 rounded-full text-xs font-semibold" [ngClass]="whatsappTone(row)">{{ whatsappLabel(row) }}</span>
                                    <div class="text-sm text-secondary">{{ row.whatsapp?.displayPhoneNumber }}</div>
                                </td>
                                <td class="px-4 py-3 text-right">{{ row.membersCount }}</td>
                                <td class="px-4 py-3 text-right">
                                    <div>{{ row.available | xaf }}</div>
                                    <div *ngIf="row.reserved" class="text-xs text-secondary">{{ row.reserved | xaf }} réservés</div>
                                </td>
                            </tr>
                            <tr *ngIf="!loading && !rows.length"><td colspan="5" class="px-4 py-10 text-center text-secondary">Aucune organisation</td></tr>
                        </tbody>
                    </table>
                </div>
                <mat-paginator [length]="total" [pageSize]="limit" [pageIndex]="page - 1" [pageSizeOptions]="[20, 50, 100]"
                               (page)="onPage($event)"></mat-paginator>
            </div>
        </div>
    `,
})
export class OrganizationsListComponent implements OnInit, OnDestroy
{
    rows: AdminOrganizationRow[] = [];
    total = 0;
    page = 1;
    limit = 20;
    search = '';
    status = '';
    whatsapp = '';
    loading = false;

    readonly planLabels = PLAN_LABELS;
    readonly subscriptionLabels = SUBSCRIPTION_LABELS;
    readonly search$ = new Subject<void>();
    private readonly _destroy$ = new Subject<void>();

    constructor(private _admin: OrganizationsAdminService, private _toastr: ToastrService, private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void
    {
        this.search$.pipe(debounceTime(300), takeUntil(this._destroy$)).subscribe(() => this.reload(1));
        this.reload();
    }

    ngOnDestroy(): void
    {
        this._destroy$.next();
        this._destroy$.complete();
    }

    reload(page = this.page): void
    {
        this.page = page;
        this.loading = true;
        this._admin.list({ page, limit: this.limit, search: this.search.trim(), status: this.status, whatsapp: this.whatsapp }).subscribe({
            next : (result) => {
                this.rows = result.data;
                this.total = result.total;
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.loading = false;
                this._toastr.error(readApiError(error), 'Organisations');
                this._cdr.markForCheck();
            },
        });
    }

    onPage(event: PageEvent): void
    {
        this.limit = event.pageSize;
        this.reload(event.pageIndex + 1);
    }

    whatsappLabel(row: AdminOrganizationRow): string
    {
        return row.whatsapp?.status === 'connected' ? 'Raccordé' : row.whatsapp?.status === 'error' ? 'En erreur' : 'À raccorder';
    }

    whatsappTone(row: AdminOrganizationRow): string
    {
        return row.whatsapp?.status === 'connected'
            ? 'bg-green-100 text-green-800'
            : row.whatsapp?.status === 'error' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800';
    }
}
