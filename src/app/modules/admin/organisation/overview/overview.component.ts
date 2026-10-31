import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import {
    Membership,
    ORG_ROLE_LABELS,
    OrganizationPlan,
    PLAN_LABELS,
    PlansCatalog,
    SUBSCRIPTION_LABELS,
    TEMPLATE_CATEGORY_LABELS,
} from 'app/core/organization/organization.types';
import { WalletService } from 'app/core/wallet/wallet.service';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

/**
 * Organisation de l'utilisateur : creation (choix de l'offre) ou tableau de
 * bord (abonnement, portefeuille partage, numero WhatsApp Business).
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
    catalog: PlansCatalog | null = null;
    selectedPlan = 'pro';
    newName = '';
    renameValue = '';
    renaming = false;
    busy = false;

    readonly roleLabels = ORG_ROLE_LABELS;
    readonly planLabels = PLAN_LABELS;
    readonly subscriptionLabels = SUBSCRIPTION_LABELS;
    readonly categoryLabels = TEMPLATE_CATEGORY_LABELS;
    readonly cloudCategories = ['marketing', 'utility', 'authentication', 'service'];

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
        // Donnees fraiches (solde, abonnement) a chaque visite.
        this._organizationService.load().subscribe();
        this._organizationService.plans().subscribe({
            next : (catalog) => {
                this.catalog = catalog;
                this._cdr.markForCheck();
            },
            error: () => undefined,
        });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get selfServicePlans(): OrganizationPlan[]
    {
        return (this.catalog?.plans || []).filter((plan) => !plan.onQuote);
    }

    get quotePlans(): OrganizationPlan[]
    {
        return (this.catalog?.plans || []).filter((plan) => plan.onQuote);
    }

    get subscriptionTone(): string
    {
        switch (this.membership?.organization?.subscription?.status) {
            case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
            case 'past_due': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200';
            default: return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
        }
    }

    get needsPayment(): boolean
    {
        const status = this.membership?.organization?.subscription?.status;
        return status === 'pending_payment' || status === 'past_due' || status === 'suspended';
    }

    get canSend(): boolean
    {
        const org = this.membership?.organization;
        return !!org && org.status === 'active'
            && org.subscription?.status !== 'pending_payment'
            && org.subscription?.status !== 'suspended'
            && org.whatsapp?.status === 'connected';
    }

    create(): void
    {
        const name = this.newName.trim();
        if (name.length < 2) {
            this._toastr.error("Le nom de l'organisation doit contenir au moins 2 caractères", 'Validation');
            return;
        }
        this.busy = true;
        this._organizationService.create(name, this.selectedPlan).subscribe({
            next : () => {
                this.busy = false;
                this._toastr.success("Organisation créée : rechargez son portefeuille pour régler l'abonnement", 'Organisation');
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

    pay(): void
    {
        this.busy = true;
        this._organizationService.paySubscription().subscribe({
            next : (membership) => {
                this.busy = false;
                const status = membership?.organization?.subscription?.status;
                if (status === 'active') this._toastr.success('Abonnement réglé', 'Organisation');
                else this._toastr.warning("Solde insuffisant : rechargez le portefeuille de l'organisation", 'Abonnement');
                this._walletService.refresh().subscribe({ error: () => undefined });
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.busy = false;
                this._toastr.error(readApiError(error), 'Abonnement');
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
