import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import {
    TEMPLATE_CATEGORY_LABELS,
    TEMPLATE_EDITABLE_STATUSES,
    TEMPLATE_STATUS,
    WhatsappTemplate,
} from 'app/core/organization/organization.types';
import { Socket } from 'ngx-socket-io';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

/**
 * Modeles de message d'un membre d'organisation : ce sont les modeles WhatsApp
 * Business approuves par Meta. Seuls eux peuvent etre envoyes hors de la
 * fenetre de 24 h et dans les campagnes. Creation, modification et suppression
 * se font sur la page Organisation > WhatsApp, vers laquelle cette vue renvoie.
 */
@Component({
    selector       : 'app-cloud-message-templates',
    templateUrl    : './cloud-message-templates.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CloudMessageTemplatesComponent implements OnInit, OnDestroy
{
    templates: WhatsappTemplate[] = [];
    loading = true;
    /** Synchronisation avec Meta en cours. */
    syncing = false;
    /** Erreur de la derniere synchronisation (les modeles affiches sont alors ceux de la base locale). */
    syncError: string | null = null;
    lastSyncAt: Date | null = null;
    expanded: string | null = null;
    readonly statusLabels = TEMPLATE_STATUS;
    readonly categoryLabels = TEMPLATE_CATEGORY_LABELS;

    private readonly _unsubscribeAll = new Subject<void>();

    constructor(
        private _organizationService: OrganizationService,
        private _router: Router,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _socket: Socket,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        // Les modeles sont lus chez Meta a l'ouverture (et non seulement la copie locale).
        this.sync();
        // Approbation Meta : mise a jour sans rechargement.
        this._socket.fromEvent<any>('template-status')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => this.sync());
    }

    /** Lit les modeles chez Meta puis affiche le resultat. En cas d'echec, affiche l'erreur et la copie locale. */
    sync(): void
    {
        this.syncing = true;
        this._cdr.markForCheck();
        this._organizationService.syncTemplates().subscribe({
            next : (templates) => {
                this.templates = templates || [];
                this.syncError = null;
                this.lastSyncAt = new Date();
                this.loading = false;
                this.syncing = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.syncError = readApiError(error);
                this.syncing = false;
                this.refresh();
            },
        });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    refresh(): void
    {
        this._organizationService.templates().subscribe({
            next : (templates) => {
                this.templates = templates || [];
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this._cdr.markForCheck();
            },
        });
    }

    keyOf(template: WhatsappTemplate): string
    {
        return `${template.name}|${template.language}`;
    }

    toggle(template: WhatsappTemplate): void
    {
        this.expanded = this.expanded === this.keyOf(template) ? null : this.keyOf(template);
    }

    statusOf(template: WhatsappTemplate): { label: string; tone: string }
    {
        return TEMPLATE_STATUS[template.status] || { label: template.status, tone: 'bg-gray-100 text-gray-700' };
    }

    canEdit(template: WhatsappTemplate): boolean
    {
        return TEMPLATE_EDITABLE_STATUSES.includes(template.status);
    }

    component(template: WhatsappTemplate, type: string): any
    {
        return (template.components || []).find((c: any) => c.type === type);
    }

    bodyOf(template: WhatsappTemplate): string
    {
        return this.component(template, 'BODY')?.text || '';
    }

    headerOf(template: WhatsappTemplate): string
    {
        const header = this.component(template, 'HEADER');
        if (!header) return '';
        return header.format === 'TEXT' ? header.text || '' : `[${String(header.format || '').toLowerCase()}]`;
    }

    footerOf(template: WhatsappTemplate): string
    {
        return this.component(template, 'FOOTER')?.text || '';
    }

    buttonsOf(template: WhatsappTemplate): { type: string; text: string }[]
    {
        return this.component(template, 'BUTTONS')?.buttons || [];
    }

    create(): void
    {
        this._router.navigate(['/organisation/whatsapp'], { queryParams: { create: 1 } });
    }

    edit(template: WhatsappTemplate): void
    {
        this._router.navigate(['/organisation/whatsapp'], {
            queryParams: { edit: template.name, language: template.language },
        });
    }

    remove(template: WhatsappTemplate): void
    {
        this._confirmation.open({
            title  : 'Supprimer le modèle',
            message: `Le modèle « ${template.name} » sera supprimé chez Meta (toutes les langues). Les messages programmés qui l'utilisent échoueront.`,
            actions: { confirm: { label: 'Supprimer' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;
            this._organizationService.deleteTemplate(template.name).subscribe({
                next : () => {
                    this._toastr.success('Modèle supprimé', 'Modèles');
                    this.refresh();
                },
                error: (error) => this._toastr.error(readApiError(error), 'Modèles'),
            });
        });
    }
}
