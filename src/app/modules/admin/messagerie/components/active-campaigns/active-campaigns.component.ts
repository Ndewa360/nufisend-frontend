import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { environment } from 'environments/environment';
import { Socket } from 'ngx-socket-io';
import { ToastrService } from 'ngx-toastr';

/** Campagne en cours ou en pause : WhatsApp Business (cloud) ou WhatsApp Web. */
export interface ActiveCampaign {
    messageId: string;
    title: string;
    channel: 'cloud' | 'whatsapp_web';
    /** immediate : envoi unique. scheduled : une occurrence de planification. */
    kind: 'immediate' | 'scheduled' | 'reply' | string;
    state: 'running' | 'paused';
    processed: number;
    total: number;
    sent: number;
    delivered: number;
    /** Envoyes sans accuse de reception : l'envoi est fait, la livraison n'est pas confirmee. */
    unconfirmed: number;
    /** Echecs francs. */
    failed: number;
    pausedReason: string | null;
    autoResumeAt: string | null;
    canAct: boolean;
}

/**
 * Envois WhatsApp en cours ou en pause : avancement, pause, reprise et arret.
 * Mis a jour en temps reel par le WebSocket.
 */
@Component({
    selector       : 'app-active-campaigns',
    standalone     : true,
    imports        : [CommonModule, MatButtonModule, MatIconModule, MatProgressBarModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div *ngIf="campaigns.length" class="flex flex-col gap-4">
            <div *ngFor="let campaign of campaigns; trackBy: trackById" class="bg-card rounded-2xl shadow p-5">
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div class="flex-auto min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="font-semibold truncate">{{ campaign.title || 'Message' }}</span>
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium"
                                  [ngClass]="campaign.state === 'paused'
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'">
                                {{ campaign.state === 'paused' ? 'En pause' : 'Envoi en cours' }}
                            </span>
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700/40 dark:text-gray-300">
                                {{ campaign.channel === 'cloud' ? 'WhatsApp Business' : 'WhatsApp Web' }}
                            </span>
                        </div>
                        <div class="mt-1 text-sm text-secondary">
                            {{ campaign.processed }} / {{ campaign.total }} destinataire(s) traité(s) ·
                            {{ campaign.sent }} envoyé(s)
                            <ng-container *ngIf="campaign.unconfirmed"> · {{ campaign.unconfirmed }} sans accusé de réception</ng-container>
                            <ng-container *ngIf="campaign.failed"> · {{ campaign.failed }} échec(s)</ng-container>
                        </div>
                        <div *ngIf="campaign.state === 'paused' && campaign.pausedReason" class="mt-1 text-sm text-amber-700 dark:text-amber-400">
                            {{ campaign.pausedReason }}
                            <ng-container *ngIf="campaign.autoResumeAt"> Nouvelle tentative vers {{ campaign.autoResumeAt | date:'HH:mm' }}.</ng-container>
                        </div>
                    </div>
                    <div *ngIf="campaign.canAct" class="flex flex-wrap gap-2 shrink-0">
                        <button *ngIf="campaign.channel === 'cloud' && campaign.state === 'running'" mat-stroked-button color="primary" type="button"
                                [disabled]="busy.has(campaign.messageId)" (click)="pause(campaign)">
                            Mettre en pause
                        </button>
                        <button *ngIf="campaign.state === 'paused'" mat-flat-button color="primary" type="button"
                                [disabled]="busy.has(campaign.messageId)" (click)="resume(campaign)">
                            Reprendre
                        </button>
                        <button mat-stroked-button color="warn" type="button"
                                [disabled]="busy.has(campaign.messageId)" (click)="cancel(campaign)">
                            Arrêter
                        </button>
                    </div>
                </div>
                <mat-progress-bar class="mt-4 rounded" mode="determinate"
                                  [value]="campaign.total ? (campaign.processed * 100) / campaign.total : 0"></mat-progress-bar>
            </div>
        </div>
    `,
})
export class ActiveCampaignsComponent implements OnInit, OnDestroy
{
    campaigns: ActiveCampaign[] = [];
    busy = new Set<string>();
    private readonly _url = `${environment.apiUrl}/message`;
    private readonly _refresh = () => this.load();
    private readonly _onProgress = (event: any) => this.applyProgress(event);

    constructor(
        private _http: HttpClient,
        private _socket: Socket,
        private _toastr: ToastrService,
        private _confirmation: FuseConfirmationService,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this.load();
        (this._socket.ioSocket as any)?.on('message-progress', this._onProgress);
        (this._socket.ioSocket as any)?.on('message-status', this._refresh);
    }

    ngOnDestroy(): void
    {
        (this._socket.ioSocket as any)?.off('message-progress', this._onProgress);
        (this._socket.ioSocket as any)?.off('message-status', this._refresh);
    }

    trackById(_: number, campaign: ActiveCampaign): string
    {
        return campaign.messageId;
    }

    load(): void
    {
        this._http.get<{ data: ActiveCampaign[] }>(`${this._url}/campaigns`).subscribe({
            next : (response) =>
            {
                this.campaigns = response?.data || [];
                this._cdr.markForCheck();
            },
            error: () => this._cdr.markForCheck(),
        });
    }

    pause(campaign: ActiveCampaign): void
    {
        this.act(campaign, 'pause', 'Campagne mise en pause');
    }

    resume(campaign: ActiveCampaign): void
    {
        this.act(campaign, 'resume', 'Reprise de la campagne demandée');
    }

    cancel(campaign: ActiveCampaign): void
    {
        const remaining = campaign.total - campaign.processed;
        // Une occurrence programmee : seule l'occurrence en cours s'arrete, les suivantes restent programmees.
        const scope = campaign.kind === 'scheduled'
            ? 'Seule cette occurrence est arrêtée : les suivantes restent programmées.'
            : '';
        this._confirmation.open({
            title  : 'Arrêter la campagne ?',
            message: `Les ${remaining} destinataire(s) restant(s) ne recevront pas le message et ne seront pas facturés. ${scope}`.trim(),
            actions: { confirm: { label: 'Arrêter' }, cancel: { label: 'Continuer l’envoi' } },
        }).afterClosed().subscribe((answer) =>
        {
            if (answer === 'confirmed') this.act(campaign, 'cancel', 'Arrêt de la campagne demandé');
        });
    }

    private act(campaign: ActiveCampaign, action: 'pause' | 'resume' | 'cancel', success: string): void
    {
        this.busy.add(campaign.messageId);
        this._cdr.markForCheck();
        this._http.post(`${this._url}/${campaign.messageId}/campaign/${action}`, {}).subscribe({
            next : () =>
            {
                this._toastr.success(success, 'Campagne');
                this.busy.delete(campaign.messageId);
                this.load();
            },
            error: (error) =>
            {
                const message = error?.error?.message;
                this._toastr.error(Array.isArray(message) ? message.join(' ') : message || 'Action impossible', 'Campagne');
                this.busy.delete(campaign.messageId);
                this.load();
            },
        });
    }

    private applyProgress(event: any): void
    {
        const campaign = this.campaigns.find((item) => item.messageId === event?.messageId);
        if (!campaign)
        {
            this.load();
            return;
        }
        Object.assign(campaign, {
            state      : event.state ?? 'running',
            processed  : event.processed ?? campaign.processed,
            total      : event.total ?? campaign.total,
            sent       : event.sent ?? campaign.sent,
            delivered  : event.delivered ?? campaign.delivered,
            unconfirmed: event.unconfirmed ?? campaign.unconfirmed,
            failed     : event.failed ?? campaign.failed,
        });
        this.campaigns = [...this.campaigns];
        this._cdr.markForCheck();
    }
}
