import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store } from '@ngxs/store';
import { OrganizationService } from 'app/core/organization/organization.service';
import { ContactAction } from 'app/shared/store/contact/contact.actions';
import { GroupAction } from 'app/shared/store/group/group.actions';
import { MessageTemplateAction } from 'app/shared/store/message-template/message-template.actions';
import { ToastrService } from 'ngx-toastr';
import { filter, switchMap } from 'rxjs';

interface PersonalDataSummary
{
    contacts: number;
    groups: number;
    templates: number;
}

const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`;

/**
 * Bandeau des donnees creees avant l'adhesion a l'organisation (contacts,
 * groupes, modeles) : invisibles dans l'annuaire partage tant qu'elles ne
 * sont pas transferees. Affiche uniquement pour un membre qui en possede.
 */
@Component({
    selector       : 'app-personal-data-transfer',
    standalone     : true,
    imports        : [CommonModule, MatButtonModule, MatIconModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div *ngIf="summary && total"
             class="rounded-2xl border border-blue-200 bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <mat-icon class="hidden sm:block text-current shrink-0" [svgIcon]="'heroicons_outline:users'"></mat-icon>
            <div class="flex-auto text-sm">
                <div class="font-semibold">Vous avez {{ description }} créés avant l'organisation.</div>
                <div class="mt-0.5">
                    Ils ne sont pas visibles dans l'annuaire de l'organisation. Transférez-les pour les retrouver ici et les utiliser
                    dans vos campagnes.
                </div>
            </div>
            <button mat-flat-button color="primary" type="button" class="shrink-0" [disabled]="busy" (click)="confirm()">
                {{ busy ? 'Transfert en cours…' : "Transférer vers l'annuaire" }}
            </button>
        </div>
    `,
})
export class PersonalDataTransferComponent implements OnInit
{
    summary: PersonalDataSummary | null = null;
    busy = false;

    constructor(
        private _organization: OrganizationService,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _store: Store,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    get total(): number
    {
        return (this.summary?.contacts || 0) + (this.summary?.groups || 0) + (this.summary?.templates || 0);
    }

    get description(): string
    {
        const parts = [
            this.summary?.contacts ? plural(this.summary.contacts, 'contact', 'contacts') : null,
            this.summary?.groups ? plural(this.summary.groups, 'groupe', 'groupes') : null,
            this.summary?.templates ? plural(this.summary.templates, 'modèle de message', 'modèles de message') : null,
        ].filter(Boolean);
        return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} et ${parts[parts.length - 1]}` : parts[0] || '';
    }

    ngOnInit(): void
    {
        // Seuls les membres d'une organisation ont des donnees a transferer.
        this._organization.loadedMembership$.pipe(
            filter((membership) => !!membership),
            switchMap(() => this._organization.personalDataSummary()),
        ).subscribe({
            next : (summary) =>
            {
                this.summary = summary;
                this._cdr.markForCheck();
            },
            error: () => undefined,
        });
    }

    confirm(): void
    {
        this._confirmation.open({
            title  : "Transférer vers l'annuaire ?",
            message: `Vos ${this.description} deviendront visibles et utilisables par tous les membres de l'organisation. `
                + "Un contact dont le numéro existe déjà dans l'annuaire est fusionné avec la fiche existante, "
                + 'et un groupe portant le même nom qu’un groupe de l’organisation est fusionné avec lui. '
                + 'Cette opération ne peut pas être annulée.',
            icon   : { show: true, name: 'heroicons_outline:users', color: 'primary' },
            actions: { confirm: { label: 'Transférer', color: 'primary' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((answer) =>
        {
            if (answer === 'confirmed') this.transfer();
        });
    }

    private transfer(): void
    {
        this.busy = true;
        this._cdr.markForCheck();
        this._organization.transferPersonalData().subscribe({
            next : (result) =>
            {
                const merged = result.contactsMerged ? `, ${plural(result.contactsMerged, 'contact fusionné', 'contacts fusionnés')} avec l'annuaire` : '';
                this._toastr.success(
                    `${plural(result.contactsMoved, 'contact transféré', 'contacts transférés')}${merged}.`,
                    'Annuaire',
                );
                this.summary = { contacts: 0, groups: 0, templates: 0 };
                this.busy = false;
                this._store.dispatch([
                    new ContactAction.FetchAllContact(true),
                    new GroupAction.FetchAllGroup(true),
                    new MessageTemplateAction.FetchAllMessageTemplate(true),
                ]);
                this._cdr.markForCheck();
            },
            error: (error) =>
            {
                const message = error?.error?.message;
                this._toastr.error(Array.isArray(message) ? message.join(' ') : message || 'Le transfert a échoué', 'Annuaire');
                this.busy = false;
                this._cdr.markForCheck();
            },
        });
    }
}
