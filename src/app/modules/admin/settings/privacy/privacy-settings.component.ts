import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AuthService } from 'app/core/auth/auth.service';
import { LEGAL_INFO } from 'app/core/legal/legal.config';
import {
    LEGAL_DOCUMENT_PATHS,
    LegalService,
    PRIVACY_REQUEST_LABELS,
    PRIVACY_STATUS_LABELS,
    PrivacyOverview,
    PrivacyRequestType,
} from 'app/core/legal/legal.service';
import { ToastrService } from 'ngx-toastr';

/**
 * Droits de l'utilisateur sur ses donnees : consentements, export (acces et
 * portabilite), demandes (rectification, opposition...) et suppression du compte.
 */
@Component({
    selector       : 'app-privacy-settings',
    templateUrl    : './privacy-settings.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacySettingsComponent implements OnInit
{
    readonly info = LEGAL_INFO;
    readonly requestLabels = PRIVACY_REQUEST_LABELS;
    readonly statusLabels = PRIVACY_STATUS_LABELS;
    readonly documentPaths = LEGAL_DOCUMENT_PATHS;
    readonly requestTypes: PrivacyRequestType[] = ['rectification', 'opposition', 'limitation', 'withdraw_consent', 'access', 'other'];

    overview: PrivacyOverview | null = null;
    loading = true;
    exporting = false;
    requestType: PrivacyRequestType = 'rectification';
    requestMessage = '';
    sendingRequest = false;
    deletePassword = '';
    deleteConfirmation = '';
    deleting = false;

    constructor(
        private _legalService: LegalService,
        private _authService: AuthService,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _router: Router,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this.reload();
    }

    reload(): void
    {
        this.loading = true;
        this._legalService.overview().subscribe({
            next : (overview) => {
                this.overview = overview;
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this._toastr.error('Impossible de charger vos informations', 'Confidentialité');
                this._cdr.markForCheck();
            },
        });
    }

    titleOf(document: string): string
    {
        return this.overview?.documents.find((d) => d.document === document)?.title || document;
    }

    exportData(): void
    {
        this.exporting = true;
        this._legalService.exportData().subscribe({
            next : (blob) => {
                this.exporting = false;
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `nufisend-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
                link.click();
                setTimeout(() => URL.revokeObjectURL(url), 10_000);
                this._toastr.success('Vos données ont été téléchargées', 'Confidentialité');
                this.reload();
            },
            error: (error) => {
                this.exporting = false;
                this._toastr.error(error?.status === 429 ? 'Trop d’exports : réessayez dans une heure.' : 'Export impossible', 'Confidentialité');
                this._cdr.markForCheck();
            },
        });
    }

    sendRequest(): void
    {
        const message = this.requestMessage.trim();
        if (message.length < 5) return;
        this.sendingRequest = true;
        this._legalService.request(this.requestType, message).subscribe({
            next : (request) => {
                this.sendingRequest = false;
                this.requestMessage = '';
                this._toastr.success(`Demande ${request.reference} enregistrée : réponse sous 30 jours`, 'Confidentialité');
                this.reload();
            },
            error: (error) => {
                this.sendingRequest = false;
                const msg = error?.error?.message;
                this._toastr.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Demande non envoyée', 'Confidentialité');
                this._cdr.markForCheck();
            },
        });
    }

    get canDelete(): boolean
    {
        return !!this.deletePassword && this.deleteConfirmation.trim() === 'SUPPRIMER' && !this.overview?.deletion?.ownerWithMembers;
    }

    deleteAccount(): void
    {
        if (!this.canDelete) return;
        this._confirmation.open({
            title  : 'Supprimer définitivement mon compte',
            message: 'Cette action est irréversible : vos contacts, groupes, modèles, programmations, contenus de messages, clés API et votre session WhatsApp seront supprimés.',
            actions: { confirm: { label: 'Supprimer mon compte' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;
            this.deleting = true;
            this._cdr.markForCheck();
            this._legalService.deleteAccount(this.deletePassword).subscribe({
                next : () => {
                    this._toastr.success('Votre compte et vos données ont été supprimés', 'Compte supprimé', { timeOut: 8000 });
                    this._authService.signOut().subscribe(() => this._router.navigate(['/home']));
                },
                error: (error) => {
                    this.deleting = false;
                    const msg = error?.error?.message;
                    this._toastr.error(Array.isArray(msg) ? msg.join(' ') : msg || 'Suppression impossible', 'Compte');
                    this._cdr.markForCheck();
                },
            });
        });
    }
}
