import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import {
    LegalService,
    PRIVACY_REQUEST_LABELS,
    PRIVACY_STATUS_LABELS,
    PrivacyRequest,
} from 'app/core/legal/legal.service';
import { ToastrService } from 'ngx-toastr';

/** Registre des demandes d'exercice des droits (super-admin). */
@Component({
    selector       : 'app-privacy-requests',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col flex-auto min-w-0 p-6 sm:p-8">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <div class="text-3xl font-bold tracking-tight">Données personnelles</div>
                    <div class="mt-1 text-secondary">Registre des demandes : {{ open }} à traiter · réponse attendue sous 30 jours.</div>
                </div>
                <a mat-stroked-button routerLink="/super-admin/dashboard">
                    <mat-icon svgIcon="heroicons_outline:arrow-left"></mat-icon><span class="ml-2">Administration</span>
                </a>
            </div>

            <div class="flex flex-col md:flex-row gap-4 mt-6">
                <mat-form-field class="flex-auto" appearance="outline" subscriptSizing="dynamic">
                    <mat-icon matPrefix class="icon-size-5" svgIcon="heroicons_outline:search"></mat-icon>
                    <input matInput [(ngModel)]="search" (keyup.enter)="reload(1)" placeholder="Référence, email, numéro, nom">
                </mat-form-field>
                <mat-form-field class="md:w-52" appearance="outline" subscriptSizing="dynamic">
                    <mat-label>Statut</mat-label>
                    <mat-select [(ngModel)]="status" (ngModelChange)="reload(1)">
                        <mat-option value="">Tous</mat-option>
                        <mat-option *ngFor="let s of statuses" [value]="s">{{ statusLabels[s] }}</mat-option>
                    </mat-select>
                </mat-form-field>
                <mat-slide-toggle class="self-center" [(ngModel)]="manualOnly" (ngModelChange)="reload(1)" color="primary">Demandes manuelles uniquement</mat-slide-toggle>
            </div>

            <div class="bg-card rounded-2xl shadow overflow-hidden mt-6">
                <mat-progress-bar *ngIf="loading" mode="indeterminate"></mat-progress-bar>
                <div *ngIf="!loading && !rows.length" class="p-10 text-center text-secondary">Aucune demande</div>
                <div *ngFor="let r of rows" class="px-6 py-4 border-b last:border-b-0">
                    <div class="flex flex-col md:flex-row md:items-start gap-3">
                        <div class="flex-auto min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="font-mono text-sm">{{ r.reference }}</span>
                                <span class="font-semibold">{{ typeLabels[r.type] }}</span>
                                <span class="px-2 py-0.5 rounded-full text-xs" [ngClass]="tone(r)">{{ statusLabels[r.status] }}</span>
                                <span *ngIf="r.automated" class="px-2 py-0.5 rounded-full text-xs bg-gray-100 dark:bg-gray-800">Automatique</span>
                                <span *ngIf="overdue(r)" class="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">En retard</span>
                            </div>
                            <div class="text-sm text-secondary mt-1">
                                {{ r.user?.email || r.email }}<ng-container *ngIf="r.fullName"> · {{ r.fullName }}</ng-container><ng-container *ngIf="r.phone"> · {{ r.phone }}</ng-container>
                                · reçue le {{ r.createdAt | date:'dd/MM/yyyy HH:mm' }} · échéance {{ r.dueAt | date:'dd/MM/yyyy' }}
                            </div>
                            <div *ngIf="r.message" class="text-sm mt-2 whitespace-pre-line">{{ r.message }}</div>
                            <div *ngIf="r.response" class="text-sm mt-2 text-secondary">Réponse : {{ r.response }}</div>
                        </div>
                        <button *ngIf="!r.automated" mat-stroked-button type="button" (click)="edit(r)">Traiter</button>
                    </div>
                    <div *ngIf="editing === r._id" class="mt-4 grid grid-cols-1 md:grid-cols-[200px_1fr_auto] gap-3 items-start">
                        <mat-form-field appearance="outline" subscriptSizing="dynamic">
                            <mat-select [(ngModel)]="draftStatus">
                                <mat-option *ngFor="let s of statuses" [value]="s">{{ statusLabels[s] }}</mat-option>
                            </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline" subscriptSizing="dynamic">
                            <textarea matInput rows="2" [(ngModel)]="draftResponse" placeholder="Réponse envoyée par email au demandeur"></textarea>
                        </mat-form-field>
                        <button mat-flat-button color="primary" type="button" [disabled]="saving" (click)="save(r)">Enregistrer</button>
                    </div>
                </div>
                <mat-paginator [length]="total" [pageSize]="limit" [pageIndex]="page - 1" [pageSizeOptions]="[20, 50]" (page)="onPage($event)"></mat-paginator>
            </div>
        </div>
    `,
})
export class PrivacyRequestsComponent implements OnInit
{
    readonly typeLabels = PRIVACY_REQUEST_LABELS;
    readonly statusLabels = PRIVACY_STATUS_LABELS;
    readonly statuses: PrivacyRequest['status'][] = ['received', 'in_progress', 'completed', 'rejected'];
    rows: PrivacyRequest[] = [];
    total = 0;
    open = 0;
    page = 1;
    limit = 20;
    search = '';
    status = '';
    manualOnly = true;
    loading = false;
    editing: string | null = null;
    draftStatus: PrivacyRequest['status'] = 'in_progress';
    draftResponse = '';
    saving = false;

    constructor(private _legalService: LegalService, private _toastr: ToastrService, private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void
    {
        this.reload();
    }

    reload(page = this.page): void
    {
        this.page = page;
        this.loading = true;
        this._legalService.adminRequests({
            page, limit: this.limit, search: this.search.trim(), status: this.status, automated: this.manualOnly ? 'false' : '',
        }).subscribe({
            next : (result) => {
                this.rows = result.data;
                this.total = result.total;
                this.open = result.open;
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this._cdr.markForCheck();
            },
        });
    }

    onPage(event: PageEvent): void
    {
        this.limit = event.pageSize;
        this.reload(event.pageIndex + 1);
    }

    edit(request: PrivacyRequest): void
    {
        this.editing = this.editing === request._id ? null : request._id;
        this.draftStatus = request.status === 'received' ? 'in_progress' : request.status;
        this.draftResponse = request.response || '';
    }

    save(request: PrivacyRequest): void
    {
        this.saving = true;
        this._legalService.adminUpdate(request._id, this.draftStatus, this.draftResponse.trim()).subscribe({
            next : () => {
                this.saving = false;
                this.editing = null;
                this._toastr.success('Demande mise à jour : le demandeur est prévenu par email', 'Données personnelles');
                this.reload();
            },
            error: () => {
                this.saving = false;
                this._toastr.error('Mise à jour impossible', 'Données personnelles');
                this._cdr.markForCheck();
            },
        });
    }

    overdue(request: PrivacyRequest): boolean
    {
        return ['received', 'in_progress'].includes(request.status) && new Date(request.dueAt).getTime() < Date.now();
    }

    tone(request: PrivacyRequest): string
    {
        return request.status === 'completed' ? 'bg-green-100 text-green-800'
            : request.status === 'rejected' ? 'bg-gray-200 text-gray-700'
                : 'bg-amber-100 text-amber-800';
    }
}
