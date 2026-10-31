import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import {
    Membership,
    OrganizationWhatsapp,
    TEMPLATE_CATEGORY_LABELS,
    WhatsappTemplate,
    templateBody,
} from 'app/core/organization/organization.types';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

declare global
{
    interface Window { FB?: any; fbAsyncInit?: () => void }
}

const TEMPLATE_STATUS: Record<string, { label: string; tone: string }> = {
    APPROVED: { label: 'Approuvé', tone: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
    PENDING : { label: 'En revue chez Meta', tone: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
    REJECTED: { label: 'Refusé', tone: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
    PAUSED  : { label: 'En pause', tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' },
    DISABLED: { label: 'Désactivé', tone: 'bg-gray-200 text-gray-700' },
};

/**
 * Numero WhatsApp Business de l'organisation (raccordement via la connexion
 * Meta integree, sinon par le support NufiSend) et modeles de messages.
 */
@Component({
    selector       : 'app-organisation-whatsapp',
    templateUrl    : './whatsapp-business.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationWhatsappComponent implements OnInit, OnDestroy
{
    membership: Membership | null = null;
    whatsapp: OrganizationWhatsapp | null = null;
    templates: WhatsappTemplate[] = [];
    loading = false;
    connecting = false;
    syncing = false;
    creating = false;
    showCreate = false;
    draft = this._emptyDraft();

    readonly categoryLabels = TEMPLATE_CATEGORY_LABELS;
    readonly templateStatus = TEMPLATE_STATUS;
    readonly templateBody = templateBody;
    readonly languages = [
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'Anglais' },
        { code: 'en_US', label: 'Anglais (US)' },
    ];

    private _signupSession: { wabaId?: string; phoneNumberId?: string } = {};
    private readonly _onMessage = (event: MessageEvent) => this._handleSignupMessage(event);
    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _organizationService: OrganizationService,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _zone: NgZone,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this._organizationService.loadedMembership$.pipe(takeUntil(this._unsubscribeAll)).subscribe((membership) => {
            this.membership = membership;
            this._cdr.markForCheck();
        });
        window.addEventListener('message', this._onMessage);
        this.reload();
    }

    ngOnDestroy(): void
    {
        window.removeEventListener('message', this._onMessage);
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get isManager(): boolean
    {
        return !!this.membership?.isManager;
    }

    get variablesCount(): number
    {
        const matches = this.draft.body.match(/\{\{\s*(\d+)\s*\}\}/g) || [];
        return new Set(matches.map((m) => m.replace(/\D/g, ''))).size;
    }

    reload(): void
    {
        this.loading = true;
        this._organizationService.whatsapp().subscribe({
            next : (whatsapp) => {
                this.whatsapp = whatsapp;
                this.loading = false;
                this._cdr.markForCheck();
                if (whatsapp?.status === 'connected') this.loadTemplates();
            },
            error: (error) => {
                this.loading = false;
                this._toastr.error(readApiError(error), 'WhatsApp Business');
                this._cdr.markForCheck();
            },
        });
    }

    loadTemplates(): void
    {
        this._organizationService.templates().subscribe({
            next : (templates) => {
                this.templates = templates;
                this._cdr.markForCheck();
            },
            error: () => undefined,
        });
    }

    refresh(): void
    {
        this.loading = true;
        this._organizationService.refreshWhatsapp().subscribe({
            next : (whatsapp) => {
                this.whatsapp = whatsapp;
                this.loading = false;
                this._toastr.success('État du numéro mis à jour', 'WhatsApp Business');
                this._organizationService.load().subscribe();
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.loading = false;
                this._toastr.error(readApiError(error), 'WhatsApp Business');
                this._cdr.markForCheck();
            },
        });
    }

    syncTemplates(): void
    {
        this.syncing = true;
        this._organizationService.syncTemplates().subscribe({
            next : () => {
                this.syncing = false;
                this._toastr.success('Modèles synchronisés avec Meta', 'Modèles');
                this.loadTemplates();
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.syncing = false;
                this._toastr.error(readApiError(error), 'Modèles');
                this._cdr.markForCheck();
            },
        });
    }

    // --------------------------------------------------------------- Embedded Signup

    /** Connexion Meta integree : l'organisation choisit ou cree son numero chez Meta. */
    startEmbeddedSignup(): void
    {
        const config = this.whatsapp?.embeddedSignup;
        if (!config?.enabled) return;
        this.connecting = true;
        this._signupSession = {};
        this._cdr.markForCheck();
        this._loadFacebookSdk(config.appId, config.graphVersion)
            .then((FB) => {
                FB.login(
                    (response: any) => this._zone.run(() => {
                        const code = response?.authResponse?.code;
                        if (!code) {
                            this.connecting = false;
                            this._toastr.info('Connexion Meta annulée', 'WhatsApp Business');
                            this._cdr.markForCheck();
                            return;
                        }
                        // Le numero choisi arrive par postMessage, parfois apres le code.
                        setTimeout(() => this._finishSignup(code), 1500);
                    }),
                    {
                        config_id                       : config.configId,
                        response_type                   : 'code',
                        override_default_response_type  : true,
                        extras                          : { setup: {}, sessionInfoVersion: '3' },
                    },
                );
            })
            .catch(() => {
                this.connecting = false;
                this._toastr.error("Impossible de charger la connexion Meta (bloqueur de publicités ?)", 'WhatsApp Business');
                this._cdr.markForCheck();
            });
    }

    private _handleSignupMessage(event: MessageEvent): void
    {
        if (!/(^|\.)facebook\.com$/.test(new URL(event.origin || 'http://x').hostname)) return;
        try {
            const payload = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
            if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return;
            if (payload.event === 'FINISH' || payload.event === 'FINISH_ONLY_WABA') {
                this._signupSession = {
                    wabaId       : payload.data?.waba_id,
                    phoneNumberId: payload.data?.phone_number_id,
                };
            } else if (payload.event === 'CANCEL') {
                this._zone.run(() => {
                    this.connecting = false;
                    this._cdr.markForCheck();
                });
            }
        } catch {
            // message d'une autre origine Facebook : ignore
        }
    }

    private _finishSignup(code: string): void
    {
        const { wabaId, phoneNumberId } = this._signupSession;
        if (!wabaId || !phoneNumberId) {
            this.connecting = false;
            this._toastr.error("Aucun numéro n'a été sélectionné chez Meta : recommencez la connexion.", 'WhatsApp Business');
            this._cdr.markForCheck();
            return;
        }
        this._organizationService.connectEmbedded(code, wabaId, phoneNumberId).subscribe({
            next : (whatsapp) => {
                this.connecting = false;
                this.whatsapp = whatsapp;
                this._toastr.success('Numéro WhatsApp Business raccordé', 'WhatsApp Business');
                this.reload();
            },
            error: (error) => {
                this.connecting = false;
                this._toastr.error(readApiError(error), 'WhatsApp Business');
                this._cdr.markForCheck();
            },
        });
    }

    private _loadFacebookSdk(appId: string, version: string): Promise<any>
    {
        if (window.FB) return Promise.resolve(window.FB);
        return new Promise((resolve, reject) => {
            window.fbAsyncInit = () => {
                window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version });
                resolve(window.FB);
            };
            const script = document.createElement('script');
            script.src = 'https://connect.facebook.net/fr_FR/sdk.js';
            script.async = true;
            script.defer = true;
            script.crossOrigin = 'anonymous';
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }

    // --------------------------------------------------------------- modeles

    /** Saisie d'un exemple : garder le champ (et le focus) en place. */
    trackByIndex(index: number): number
    {
        return index;
    }

    openCreate(): void
    {
        this.draft = this._emptyDraft();
        this.showCreate = true;
    }

    syncExamples(): void
    {
        const count = this.variablesCount;
        this.draft.bodyExamples = Array.from({ length: count }, (_, i) => this.draft.bodyExamples[i] || '');
    }

    createTemplate(): void
    {
        const name = this.draft.name.trim().toLowerCase();
        if (!/^[a-z0-9_]+$/.test(name)) {
            this._toastr.error('Nom : lettres minuscules, chiffres et _ uniquement (ex. promo_noel)', 'Modèle');
            return;
        }
        if (!this.draft.body.trim()) {
            this._toastr.error('Le texte du modèle est requis', 'Modèle');
            return;
        }
        this.syncExamples();
        if (this.draft.bodyExamples.some((value) => !value.trim())) {
            this._toastr.error('Donnez un exemple pour chaque variable {{n}} : Meta les exige pour valider le modèle', 'Modèle');
            return;
        }
        this.creating = true;
        this._organizationService.createTemplate({
            name,
            language    : this.draft.language,
            category    : this.draft.category,
            body        : this.draft.body.trim(),
            bodyExamples: this.draft.bodyExamples.map((value) => value.trim()),
            headerText  : this.draft.headerText.trim() || undefined,
            footer      : this.draft.footer.trim() || undefined,
        }).subscribe({
            next : () => {
                this.creating = false;
                this.showCreate = false;
                this._toastr.success('Modèle soumis à Meta : la validation prend de quelques minutes à 24 h', 'Modèle');
                this.loadTemplates();
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.creating = false;
                this._toastr.error(readApiError(error), 'Modèle');
                this._cdr.markForCheck();
            },
        });
    }

    deleteTemplate(template: WhatsappTemplate): void
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
                    this.loadTemplates();
                },
                error: (error) => this._toastr.error(readApiError(error), 'Modèles'),
            });
        });
    }

    private _emptyDraft()
    {
        return {
            name        : '',
            language    : 'fr',
            category    : 'MARKETING',
            body        : '',
            bodyExamples: [] as string[],
            headerText  : '',
            footer      : '',
        };
    }
}
