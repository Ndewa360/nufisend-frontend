import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import {
    Membership,
    ORG_ROLE_LABELS,
    PLAN_LABELS,
} from 'app/core/organization/organization.types';
import { WalletService } from 'app/core/wallet/wallet.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

/**
 * Organisation de l'utilisateur : creation ou tableau de bord
 * (portefeuille partage, membres, numero WhatsApp Business).
 */
@Component({
    selector       : 'app-organisation-overview',
    templateUrl    : './overview.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationOverviewComponent implements OnInit, OnDestroy
{
    membership: Membership | null | undefined = undefined;
    newName = '';
    renameValue = '';
    renaming = false;
    busy = false;

    readonly roleLabels = ORG_ROLE_LABELS;
    readonly planLabels = PLAN_LABELS;

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _organizationService: OrganizationService,
        private _walletService: WalletService,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _router: Router,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this._organizationService.membership$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((membership) => {
                this.membership = membership;
                this.renameValue = membership?.organization?.name || '';
                this._cdr.markForCheck();
            });
        // Donnees fraiches (solde) a chaque visite.
        this._organizationService.load().subscribe();
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get canSend(): boolean
    {
        const org = this.membership?.organization;
        return !!org && org.status === 'active' && org.whatsapp?.status === 'connected';
    }

    create(): void
    {
        const name = this.newName.trim();
        if (name.length < 2) {
            this._toastr.error("Le nom de l'organisation doit contenir au moins 2 caractères", 'Validation');
            return;
        }
        this.busy = true;
        this._organizationService.create(name).subscribe({
            next : () => {
                this.busy = false;
                this._toastr.success("Organisation créée : rechargez son portefeuille pour lancer votre première campagne", 'Organisation');
                this._walletService.refresh().subscribe({ error: () => undefined });
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.busy = false;
                this._toastr.error(readApiError(error), 'Organisation');
                this._cdr.markForCheck();
            },
        });
    }

    saveName(): void
    {
        const name = this.renameValue.trim();
        if (name.length < 2) return;
        this.busy = true;
        this._organizationService.rename(name).subscribe({
            next : () => {
                this.busy = false;
                this.renaming = false;
                this._toastr.success('Nom mis à jour', 'Organisation');
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.busy = false;
                this._toastr.error(readApiError(error), 'Organisation');
                this._cdr.markForCheck();
            },
        });
    }

    leave(): void
    {
        const isOwner = this.membership?.role === 'owner';
        this._confirmation.open({
            title  : "Quitter l'organisation",
            message: isOwner
                ? "En tant que propriétaire, transférez d'abord la propriété à un autre membre (page Membres), ou retirez tous les membres avant de quitter."
                : "Vous n'enverrez plus de messages par le numéro de l'organisation. Vos messages programmés pour l'organisation seront arrêtés.",
            actions: { confirm: { label: 'Quitter' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;
            this._organizationService.leave().subscribe({
                next : () => {
                    this._toastr.success("Vous avez quitté l'organisation", 'Organisation');
                    this._walletService.refresh().subscribe({ error: () => undefined });
                    this._router.navigate(['/organisation/overview']);
                },
                error: (error) => this._toastr.error(readApiError(error), 'Organisation'),
            });
        });
    }
}
