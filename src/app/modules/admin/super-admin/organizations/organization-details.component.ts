import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { readApiError } from 'app/core/organization/organization.service';
import { ORG_ROLE_LABELS, OrganizationWhatsapp, PLAN_LABELS, SUBSCRIPTION_LABELS } from 'app/core/organization/organization.types';
import { ToastrService } from 'ngx-toastr';
import { AdminOrganizationDetails, OrganizationsAdminService } from './organizations-admin.service';

/**
 * Fiche d'une organisation (super-admin) : offre et suspension, membres, et
 * raccordement manuel du numero WhatsApp Business (identifiants fournis par
 * Meta), tant que la connexion integree n'est pas disponible.
 */
@Component({
    selector       : 'app-organization-details',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="flex flex-col flex-auto min-w-0 p-6 sm:p-8">
            <a mat-button class="self-start -ml-3" routerLink="/super-admin/organizations">
                <mat-icon svgIcon="heroicons_outline:arrow-left"></mat-icon><span class="ml-2">Organisations</span>
            </a>

            <div *ngIf="!details" class="flex justify-center py-16">
                <mat-progress-spinner [diameter]="36" mode="indeterminate"></mat-progress-spinner>
            </div>

            <ng-container *ngIf="details as d">
                <div class="mt-2 flex flex-wrap items-center gap-3">
                    <div class="text-3xl font-bold tracking-tight">{{ d.organization.name }}</div>
                    <span class="px-2 py-1 rounded-full text-xs font-semibold"
                          [ngClass]="d.organization.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
                        {{ d.organization.status === 'active' ? 'Active' : 'Suspendue' }}
                    </span>
                </div>
                <div class="text-secondary mt-1">
                    Offre {{ planLabels[d.organization.plan] || d.organization.plan }} ·
                    abonnement {{ subscriptionLabels[d.organization.subscription?.status] || '—' }}
                    ({{ (d.organization.subscription?.monthlyPrice || 0) | xaf }} / mois)
                    <ng-container *ngIf="d.organization.subscription?.currentPeriodEnd"> · jusqu'au {{ d.organization.subscription.currentPeriodEnd | date:'dd/MM/yyyy' }}</ng-container>
                </div>

                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-6">
                    <!-- Offre et statut -->
                    <div class="bg-card rounded-2xl shadow p-6">
                        <div class="text-lg font-semibold">Offre et statut</div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                                <mat-label>Offre</mat-label>
                                <mat-select [(ngModel)]="form.plan">
                                    <mat-option *ngFor="let plan of plans" [value]="plan">{{ planLabels[plan] }}</mat-option>
                                </mat-select>
                            </mat-form-field>
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                                <mat-label>Prix mensuel (FCFA)</mat-label>
                                <input matInput type="number" min="0" [(ngModel)]="form.monthlyPrice">
                            </mat-form-field>
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                                <mat-label>Nombre de membres max</mat-label>
                                <input matInput type="number" min="1" [(ngModel)]="form.maxMembers" placeholder="Celui de l'offre">
                            </mat-form-field>
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                                <mat-label>Statut</mat-label>
                                <mat-select [(ngModel)]="form.status">
                                    <mat-option value="active">Active</mat-option>
                                    <mat-option value="suspended">Suspendue</mat-option>
                                </mat-select>
                            </mat-form-field>
                        </div>
                        <mat-form-field *ngIf="form.status === 'suspended'" class="w-full mt-4" appearance="outline" subscriptSizing="dynamic">
                            <mat-label>Motif de suspension (affiché aux membres)</mat-label>
                            <input matInput [(ngModel)]="form.suspensionReason" maxlength="300">
                        </mat-form-field>
                        <div class="flex justify-end mt-4">
                            <button mat-flat-button color="primary" type="button" [disabled]="saving" (click)="save()">Enregistrer</button>
                        </div>
                    </div>

                    <!-- Membres -->
                    <div class="bg-card rounded-2xl shadow p-6">
                        <div class="text-lg font-semibold">Membres ({{ d.members.length }} / {{ d.maxMembers }})</div>
                        <div *ngFor="let member of d.members" class="flex items-center justify-between gap-3 py-3 border-b last:border-b-0">
                            <div class="min-w-0">
                                <a class="font-medium hover:underline" [routerLink]="['/super-admin/users', member.userId]">{{ member.name || member.email }}</a>
                                <div class="text-sm text-secondary truncate">{{ member.email }} · depuis le {{ member.joinedAt | date:'dd/MM/yyyy' }}</div>
                            </div>
                            <span class="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800">{{ roleLabels[member.role] }}</span>
                        </div>
                    </div>
                </div>

                <!-- WhatsApp Business -->
                <div class="bg-card rounded-2xl shadow p-6 mt-6">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div class="text-lg font-semibold">Numéro WhatsApp Business</div>
                        <div *ngIf="whatsapp?.status && whatsapp.status !== 'not_connected'" class="flex gap-2">
                            <button mat-stroked-button type="button" [disabled]="connecting" (click)="refresh()">Actualiser</button>
                            <button mat-stroked-button color="warn" type="button" [disabled]="connecting" (click)="disconnect()">Déconnecter</button>
                        </div>
                    </div>

                    <div *ngIf="whatsapp?.status === 'connected'" class="mt-4">
                        <div class="text-xl font-bold">{{ whatsapp.displayPhoneNumber }}</div>
                        <div class="text-secondary">{{ whatsapp.verifiedName }}</div>
                        <div class="flex flex-wrap gap-2 mt-3 text-sm">
                            <span class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">WABA {{ whatsapp.wabaId }}</span>
                            <span class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">Numéro {{ whatsapp.phoneNumberId }}</span>
                            <span *ngIf="whatsapp.qualityRating" class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">Qualité {{ whatsapp.qualityRating }}</span>
                            <span *ngIf="whatsapp.messagingLimitTier" class="px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800">{{ whatsapp.messagingLimitTier }}</span>
                            <span class="px-2 py-1 rounded-full" [ngClass]="whatsapp.creditLineAttached ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'">
                                {{ whatsapp.creditLineAttached ? 'Facturé à la ligne de crédit NufiSend' : 'Ligne de crédit non rattachée' }}
                            </span>
                        </div>
                    </div>
                    <fuse-alert *ngIf="whatsapp?.status === 'error'" class="mt-4" type="error" appearance="border">
                        {{ whatsapp.lastError || 'Numéro en erreur' }}
                    </fuse-alert>

                    <ng-container *ngIf="whatsapp?.status !== 'connected'">
                        <div class="text-sm text-secondary mt-4">
                            Raccordement manuel : identifiants du compte WhatsApp Business (WABA), du numéro et d'un jeton d'utilisateur système
                            ayant les droits whatsapp_business_messaging et whatsapp_business_management. Le jeton est stocké chiffré.
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                                <mat-label>ID du compte WhatsApp Business (WABA)</mat-label>
                                <input matInput [(ngModel)]="connection.wabaId" inputmode="numeric">
                            </mat-form-field>
                            <mat-form-field appearance="outline" subscriptSizing="dynamic">
                                <mat-label>ID du numéro de téléphone</mat-label>
                                <input matInput [(ngModel)]="connection.phoneNumberId" inputmode="numeric">
                            </mat-form-field>
                        </div>
                        <mat-form-field class="w-full mt-4" appearance="outline" subscriptSizing="dynamic">
                            <mat-label>Jeton d'accès</mat-label>
                            <input matInput type="password" autocomplete="off" [(ngModel)]="connection.accessToken">
                        </mat-form-field>
                        <div class="flex flex-col md:flex-row md:items-center gap-4 mt-4">
                            <mat-slide-toggle [(ngModel)]="connection.register" color="primary">Enregistrer le numéro sur l'API Cloud</mat-slide-toggle>
                            <mat-form-field *ngIf="connection.register" class="md:w-64" appearance="outline" subscriptSizing="dynamic">
                                <mat-label>Code PIN (6 chiffres)</mat-label>
                                <input matInput [(ngModel)]="connection.pin" maxlength="6" inputmode="numeric">
                            </mat-form-field>
                        </div>
                        <div class="flex justify-end mt-4">
                            <button mat-flat-button color="primary" type="button" [disabled]="connecting || !canConnect" (click)="connect()">
                                <mat-progress-spinner *ngIf="connecting; else connectLabel" [diameter]="20" mode="indeterminate"></mat-progress-spinner>
                                <ng-template #connectLabel>Raccorder le numéro</ng-template>
                            </button>
                        </div>
                    </ng-container>
                </div>
            </ng-container>
        </div>
    `,
})
export class OrganizationDetailsComponent implements OnInit
{
    id = '';
    details: AdminOrganizationDetails | null = null;
    whatsapp: OrganizationWhatsapp | null = null;
    saving = false;
    connecting = false;
    form: { plan: string; monthlyPrice: number; maxMembers: number | null; status: 'active' | 'suspended'; suspensionReason: string } = {
        plan: 'pro', monthlyPrice: 0, maxMembers: null, status: 'active', suspensionReason: '',
    };
    connection = { wabaId: '', phoneNumberId: '', accessToken: '', register: false, pin: '' };

    readonly plans = ['pro', 'business', 'enterprise'];
    readonly planLabels = PLAN_LABELS;
    readonly subscriptionLabels = SUBSCRIPTION_LABELS;
    readonly roleLabels = ORG_ROLE_LABELS;

    constructor(
        private _route: ActivatedRoute,
        private _admin: OrganizationsAdminService,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this.id = this._route.snapshot.paramMap.get('id') || '';
        this.load();
    }

    get canConnect(): boolean
    {
        const c = this.connection;
        return /^\d{5,25}$/.test(c.wabaId.trim()) && /^\d{5,25}$/.test(c.phoneNumberId.trim())
            && c.accessToken.trim().length >= 20 && (!c.register || /^\d{6}$/.test(c.pin.trim()));
    }

    load(): void
    {
        this._admin.get(this.id).subscribe({
            next : (details) => {
                this.details = details;
                const org = details.organization;
                this.form = {
                    plan            : org.plan,
                    monthlyPrice    : org.subscription?.monthlyPrice ?? 0,
                    maxMembers      : org.maxMembers ?? null,
                    status          : org.status,
                    suspensionReason: org.suspensionReason || '',
                };
                this._cdr.markForCheck();
            },
            error: (error) => this._toastr.error(readApiError(error), 'Organisation'),
        });
        this._admin.whatsapp(this.id).subscribe({
            next : (whatsapp) => {
                this.whatsapp = whatsapp;
                this._cdr.markForCheck();
            },
            error: () => undefined,
        });
    }

    save(): void
    {
        this.saving = true;
        this._admin.update(this.id, {
            plan            : this.form.plan,
            monthlyPrice    : Number(this.form.monthlyPrice) || 0,
            maxMembers      : this.form.maxMembers ? Number(this.form.maxMembers) : null,
            status          : this.form.status,
            ...(this.form.status === 'suspended' ? { suspensionReason: this.form.suspensionReason.trim() } : {}),
        }).subscribe({
            next : (details) => {
                this.saving = false;
                this.details = details;
                this._toastr.success('Organisation mise à jour', 'Organisation');
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.saving = false;
                this._toastr.error(readApiError(error), 'Organisation');
                this._cdr.markForCheck();
            },
        });
    }

    connect(): void
    {
        this.connecting = true;
        const c = this.connection;
        this._admin.connect(this.id, {
            wabaId       : c.wabaId.trim(),
            phoneNumberId: c.phoneNumberId.trim(),
            accessToken  : c.accessToken.trim(),
            ...(c.register ? { register: true, pin: c.pin.trim() } : {}),
        }).subscribe({
            next : (whatsapp) => {
                this.connecting = false;
                this.whatsapp = whatsapp;
                this.connection = { wabaId: '', phoneNumberId: '', accessToken: '', register: false, pin: '' };
                this._toastr.success('Numéro raccordé', 'WhatsApp Business');
                this.load();
            },
            error: (error) => {
                this.connecting = false;
                this._toastr.error(readApiError(error), 'WhatsApp Business');
                this._cdr.markForCheck();
            },
        });
    }

    refresh(): void
    {
        this.connecting = true;
        this._admin.refresh(this.id).subscribe({
            next : (whatsapp) => {
                this.connecting = false;
                this.whatsapp = whatsapp;
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.connecting = false;
                this._toastr.error(readApiError(error), 'WhatsApp Business');
                this._cdr.markForCheck();
            },
        });
    }

    disconnect(): void
    {
        this._confirmation.open({
            title  : 'Déconnecter le numéro',
            message: "Les envois de l'organisation seront bloqués jusqu'à un nouveau raccordement. Le jeton stocké est effacé.",
            actions: { confirm: { label: 'Déconnecter' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;
            this._admin.disconnect(this.id).subscribe({
                next : () => {
                    this._toastr.success('Numéro déconnecté', 'WhatsApp Business');
                    this.load();
                },
                error: (error) => this._toastr.error(readApiError(error), 'WhatsApp Business'),
            });
        });
    }
}
