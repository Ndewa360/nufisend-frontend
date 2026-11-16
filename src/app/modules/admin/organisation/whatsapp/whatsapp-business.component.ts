import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import {
    Membership,
    OrganizationWhatsapp,
    TEMPLATE_CATEGORY_LABELS,
    TEMPLATE_STATUS,
    WhatsappConnectionMode,
    WhatsappTemplate,
    templateBody,
} from 'app/core/organization/organization.types';
import { ToastrService } from 'ngx-toastr';
import { Socket } from 'ngx-socket-io';
import { Subject, takeUntil } from 'rxjs';

declare global
{
    interface Window { FB?: any; fbAsyncInit?: () => void }
}


interface ButtonDraft
{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'OTP';
    text: string;
    url: string;
    urlExample: string;
    phoneNumber: string;
}

/**
 * Numero WhatsApp Business de l'organisation : raccordement autonome via la
 * connexion Meta (Embedded Signup) ou avec ses propres identifiants, puis
 * creation et suivi de l'approbation des modeles. Aucune intervention du
 * support NufiSend n'est necessaire.
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
    showManual = false;
    showButtons = false;
    manual = { wabaId: '', phoneNumberId: '', accessToken: '', pin: '', register: false, mode: 'standard' as WhatsappConnectionMode };
    draft = this._emptyDraft();

    readonly categoryLabels = TEMPLATE_CATEGORY_LABELS;
    readonly templateStatus = TEMPLATE_STATUS;
    readonly templateBody = templateBody;
    readonly languages = [
        { code: 'fr', label: 'Français' },
        { code: 'en', label: 'Anglais' },
        { code: 'en_US', label: 'Anglais (US)' },
        { code: 'fr_FR', label: 'Français (France)' },
    ];
    readonly headerFormats = [
        { code: 'NONE', label: 'Aucun en-tête' },
        { code: 'TEXT', label: 'Texte' },
        { code: 'IMAGE', label: 'Image' },
        { code: 'VIDEO', label: 'Vidéo' },
        { code: 'DOCUMENT', label: 'Document' },
    ];
    readonly buttonTypes = [
        { code: 'QUICK_REPLY', label: 'Réponse rapide' },
        { code: 'URL', label: 'Lien (URL)' },
        { code: 'PHONE_NUMBER', label: 'Appeler' },
        { code: 'OTP', label: 'Code à copier (authentification)' },
    ];
    readonly mediaHeaders = ['IMAGE', 'VIDEO', 'DOCUMENT'];

    /** Mode choisi avant la connexion Meta : numero neuf ou deja dans WhatsApp Business. */
    signupMode: WhatsappConnectionMode = 'standard';

    private _signupSession: { wabaId?: string; phoneNumberId?: string } = {};
    private readonly _onMessage = (event: MessageEvent) => this._handleSignupMessage(event);
    private _unsubscribeAll = new Subject<void>();
    private _pollTimer: ReturnType<typeof setInterval> | null = null;

    /** Modele en cours de modification (null : creation). */
    editing: WhatsappTemplate | null = null;

    constructor(
        private _organizationService: OrganizationService,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _zone: NgZone,
        private _cdr: ChangeDetectorRef,
        private _socket: Socket,
        private _route: ActivatedRoute,
        private _router: Router,
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
        this._socket.fromEvent<any>('template-status')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => this.refreshTemplates(true));
        this.reload();
        // Liens depuis « Modèles de message » : ?create=1 ou ?edit=<nom>&language=<langue>.
        this._route.queryParamMap.pipe(takeUntil(this._unsubscribeAll)).subscribe((params) => {
            if (params.get('create')) this.openCreate();
            if (params.get('edit')) this._openEditByName(params.get('edit'), params.get('language'));
        });
    }

    ngOnDestroy(): void
    {
        window.removeEventListener('message', this._onMessage);
        this._stopPolling();
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get isManager(): boolean
    {
        return !!this.membership?.isManager;
    }

    get embeddedEnabled(): boolean
    {
        return !!this.whatsapp?.embeddedSignup?.enabled;
    }

    /** Indices des variables {{n}} du corps, dans l'ordre. */
    get variableIndexes(): number[]
    {
        const indexes = new Set<number>();
        for (const match of (this.draft.body || '').matchAll(/\{\{\s*(\d+)\s*\}\}/g))
            indexes.add(Number(match[1]));
        return [...indexes].sort((a, b) => a - b);
    }

    get variablesCount(): number
    {
        return this.variableIndexes.length;
    }

    /** Erreur de numerotation des variables (Meta exige 1,2,3... sans trou). */
    get variablesIssue(): string | null
    {
        const indexes = this.variableIndexes;
        if (indexes.some((index, i) => index !== i + 1))
            return 'Numérotez les variables {{1}}, {{2}}, {{3}}… sans sauter de numéro.';
        if (/\{\{\s*\d+\s*\}\}\s*\{\{\s*\d+\s*\}\}/.test(this.draft.body || ''))
            return 'Séparez les variables par du texte : Meta refuse {{1}}{{2}} collés.';
        return null;
    }

    get hasPendingTemplates(): boolean
    {
        return this.templates.some((template) => template.status === 'PENDING' || template.status === 'IN_APPEAL');
    }

    /** Apercu du modele tel qu'il sera soumis a Meta. */
    get preview(): string
    {
        const parts: string[] = [];
        if (this.draft.headerFormat === 'TEXT' && this.draft.headerText.trim())
            parts.push(this.draft.headerText.trim());
        else if (this.mediaHeaders.includes(this.draft.headerFormat))
            parts.push(`[${this.draft.headerFormat.toLowerCase()} : ${this.draft.headerMediaUrl.trim() || 'exemple à fournir'}]`);
        let body = this.draft.body || '';
        this.draft.bodyExamples.forEach((example, i) => {
            body = body.split(new RegExp(`\\{\\{\\s*${i + 1}\\s*\\}\\}`, 'g')).join(example || `{{${i + 1}}}`);
        });
        if (body) parts.push(body);
        if (this.draft.footer.trim()) parts.push(this.draft.footer.trim());
        this.draft.buttons.forEach((button) => {
            if (button.type === 'OTP') parts.push(`[Bouton : ${button.text || 'Copier le code'}]`);
            else if (button.type === 'URL') parts.push(`[Lien : ${button.text || 'Ouvrir'}]`);
            else if (button.type === 'PHONE_NUMBER') parts.push(`[Appel : ${button.text || 'Appeler'}]`);
            else parts.push(`[Réponse : ${button.text || '...'}]`);
        });
        return parts.join('\n');
    }

    reload(): void
    {
        this.loading = true;
        this._organizationService.whatsapp().subscribe({
            next : (whatsapp) => {
                this.whatsapp = whatsapp;
                this.loading = false;
                this._cdr.markForCheck();
                if (whatsapp?.status === 'connected') this.refreshTemplates(true);
                else this._stopPolling();
            },
            error: (error) => {
                this.loading = false;
                this._toastr.error(readApiError(error), 'WhatsApp Business');
                this._cdr.markForCheck();
            },
        });
    }

    /** Relit les statuts chez Meta : filet de securite si un webhook est perdu. */
    refreshTemplates(silent = false): void
    {
        if (!silent) this.syncing = true;
        this._organizationService.syncTemplates().subscribe({
            next : (templates) => {
                this.templates = templates || [];
                this.syncing = false;
                this._schedulePolling();
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.syncing = false;
                if (!silent) this._toastr.error(readApiError(error), 'Modèles');
                this._organizationService.templates().subscribe({
                    next : (templates) => {
                        this.templates = templates;
                        this._schedulePolling();
                        this._cdr.markForCheck();
                    },
                    error: () => undefined,
                });
                this._cdr.markForCheck();
            },
        });
    }

    private _schedulePolling(): void
    {
        if (this.hasPendingTemplates && !this._pollTimer) {
            this._pollTimer = setInterval(() => this.refreshTemplates(true), 30_000);
        } else if (!this.hasPendingTemplates) {
            this._stopPolling();
        }
    }

    private _stopPolling(): void
    {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
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
                if (whatsapp?.status === 'connected') this.refreshTemplates(true);
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
        this.refreshTemplates(false);
    }

    // --------------------------------------------------------------- Embedded Signup

    /** Connexion Meta integree : l'organisation choisit ou cree son numero chez Meta. */
    startEmbeddedSignup(): void
    {
        const config = this.whatsapp?.embeddedSignup;
        if (!config?.enabled) {
            this._toastr.warning('La connexion Meta automatique n’est pas encore configurée : utilisez la connexion avec identifiants.', 'WhatsApp Business');
            this.showManual = true;
            return;
        }
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
                        extras                          : this._signupExtras(),
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
            if (
                payload.event === 'FINISH' ||
                payload.event === 'FINISH_ONLY_WABA' ||
                payload.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
            ) {
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
        const coexistence = this.signupMode === 'coexistence';
        if (!wabaId || (!phoneNumberId && !coexistence)) {
            this.connecting = false;
            this._toastr.error("Les identifiants du compte Meta n'ont pas été reçus : recommencez la connexion.", 'WhatsApp Business');
            this._cdr.markForCheck();
            return;
        }
        this._organizationService.connectEmbedded(code, wabaId, phoneNumberId ?? null, this.signupMode).subscribe({
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

    /**
     * Parametres du lancement Embedded Signup. `sessionInfoVersion` 3 active la
     * journalisation de session exigee par Meta ; `featureType` ouvre le
     * raccordement d'un numero deja utilise dans l'application WhatsApp Business.
     */
    private _signupExtras(): Record<string, unknown>
    {
        return this.signupMode === 'coexistence'
            ? { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' }
            : { setup: {}, sessionInfoVersion: '3' };
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

    // --------------------------------------------------------------- connexion manuelle

    openManual(): void
    {
        this.manual = { wabaId: '', phoneNumberId: '', accessToken: '', pin: '', register: false, mode: this.signupMode };
        this.showManual = true;
    }

    connectManual(): void
    {
        const wabaId = this.manual.wabaId.trim();
        const phoneNumberId = this.manual.phoneNumberId.trim();
        const accessToken = this.manual.accessToken.trim();
        if (!/^\d{5,25}$/.test(wabaId) || !/^\d{5,25}$/.test(phoneNumberId)) {
            this._toastr.error('Identifiants Meta invalides (WABA et numéro : 5 à 25 chiffres)', 'WhatsApp Business');
            return;
        }
        if (accessToken.length < 20) {
            this._toastr.error('Jeton d’accès Meta invalide', 'WhatsApp Business');
            return;
        }
        const pin = this.manual.pin.trim();
        if (pin && !/^\d{6}$/.test(pin)) {
            this._toastr.error('Le PIN de vérification en deux étapes doit contenir 6 chiffres', 'WhatsApp Business');
            return;
        }
        this.connecting = true;
        this._organizationService.connectManual({
            wabaId, phoneNumberId, accessToken,
            register: this.manual.mode === 'coexistence' ? false : this.manual.register,
            mode    : this.manual.mode,
            ...(pin ? { pin } : {}),
        }).subscribe({
            next : (whatsapp) => {
                this.connecting = false;
                this.showManual = false;
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

    restartConnection(): void
    {
        this._confirmation.open({
            title  : 'Recommencer le raccordement',
            message: 'Le numéro actuel sera déconnecté. Vous pourrez en raccorder un nouveau. Les modèles et l’historique restent conservés.',
            actions: { confirm: { label: 'Recommencer' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;
            this._organizationService.disconnectWhatsapp().subscribe({
                next : (whatsapp) => {
                    this.whatsapp = whatsapp;
                    this.templates = [];
                    this._stopPolling();
                    this._toastr.success('Numéro déconnecté : vous pouvez raccorder un nouveau numéro', 'WhatsApp Business');
                    this._cdr.markForCheck();
                },
                error: (error) => this._toastr.error(readApiError(error), 'WhatsApp Business'),
            });
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
        this.editing = null;
        this.draft = this._emptyDraft();
        this.showCreate = true;
        this.showButtons = false;
        this._clearQueryParams();
    }

    /** Ouvre le formulaire pre-rempli avec un modele soumis (structure reconstruite depuis ses composants). */
    openEdit(template: WhatsappTemplate): void
    {
        const components: any[] = template.components || [];
        const header = components.find((c) => c.type === 'HEADER');
        const body = components.find((c) => c.type === 'BODY');
        const footer = components.find((c) => c.type === 'FOOTER');
        const buttons = components.find((c) => c.type === 'BUTTONS')?.buttons || [];
        const draft = this._emptyDraft();
        draft.name = template.name;
        draft.language = template.language;
        draft.category = String(template.category || 'MARKETING').toUpperCase();
        draft.body = body?.text || '';
        draft.bodyExamples = (body?.example?.body_text?.[0] as string[] | undefined) || [];
        draft.headerFormat = header?.format ? String(header.format).toUpperCase() : 'NONE';
        draft.headerText = header?.format === 'TEXT' ? header.text || '' : '';
        // L'URL du media d'en-tete n'est pas relue chez Meta : a ressaisir si le modele en a un.
        draft.headerMediaUrl = '';
        draft.footer = footer?.text || '';
        draft.buttons = buttons.map((button: any) => ({
            type       : button.type,
            text       : button.text || '',
            url        : button.url || '',
            urlExample : Array.isArray(button.example) ? button.example[0] || '' : '',
            phoneNumber: button.phone_number || '',
        }));
        this.draft = draft;
        this.editing = template;
        this.showCreate = true;
        this.showButtons = this.draft.buttons.length > 0;
        this._cdr.markForCheck();
    }

    private _openEditByName(name: string, language: string | null): void
    {
        this._organizationService.templates().subscribe({
            next : (templates) => {
                const template = templates.find((t) => t.name === name && (!language || t.language === language));
                if (template) this.openEdit(template);
                this._clearQueryParams();
            },
            error: () => this._clearQueryParams(),
        });
    }

    private _clearQueryParams(): void
    {
        if (this._route.snapshot.queryParamMap.keys.length)
            this._router.navigate([], { relativeTo: this._route, queryParams: {}, replaceUrl: true });
    }

    syncExamples(): void
    {
        const count = this.variablesCount;
        this.draft.bodyExamples = Array.from({ length: count }, (_, i) => this.draft.bodyExamples[i] || '');
    }

    addButton(): void
    {
        const type = this.draft.category === 'AUTHENTICATION' ? 'OTP' : 'QUICK_REPLY';
        this.draft.buttons.push({ type: type as ButtonDraft['type'], text: '', url: '', urlExample: '', phoneNumber: '' });
        this.showButtons = true;
    }

    removeButton(index: number): void
    {
        this.draft.buttons.splice(index, 1);
    }

    onCategoryChange(): void
    {
        if (this.draft.category === 'AUTHENTICATION' && !this.draft.buttons.some((button) => button.type === 'OTP')) {
            this.draft.buttons = [{ type: 'OTP', text: 'Copier le code', url: '', urlExample: '', phoneNumber: '' }];
            this.showButtons = true;
        }
    }

    private _validateDraft(): string | null
    {
        const name = this.draft.name.trim().toLowerCase();
        if (!/^[a-z0-9_]+$/.test(name))
            return 'Nom : lettres minuscules, chiffres et _ uniquement (ex. promo_noel).';
        if (!this.draft.body.trim()) return 'Le texte du modèle est requis.';
        if (this.variablesIssue) return this.variablesIssue;
        this.syncExamples();
        if (this.draft.bodyExamples.some((value) => !value.trim()))
            return 'Donnez un exemple pour chaque variable {{n}} : Meta les exige pour valider le modèle.';
        if (this.draft.headerFormat === 'TEXT' && !this.draft.headerText.trim())
            return 'Le texte de l’en-tête est requis.';
        if (this.mediaHeaders.includes(this.draft.headerFormat) && !/^https:\/\//.test(this.draft.headerMediaUrl.trim()))
            return 'Un lien public https vers un exemple de média est requis pour cet en-tête.';
        const buttons = this.draft.buttons;
        const hasOtp = buttons.some((button) => button.type === 'OTP');
        const hasQuickReply = buttons.some((button) => button.type === 'QUICK_REPLY');
        const hasCta = buttons.some((button) => button.type === 'URL' || button.type === 'PHONE_NUMBER');
        if (buttons.some((button) => !button.text.trim() || button.text.length > 25))
            return 'Chaque bouton doit avoir un texte de 1 à 25 caractères.';
        if (hasOtp && buttons.length !== 1) return 'Un bouton OTP doit être le seul bouton du modèle.';
        if (hasOtp && this.draft.category !== 'AUTHENTICATION') return 'Le bouton OTP est réservé aux modèles AUTHENTICATION.';
        if (this.draft.category === 'AUTHENTICATION' && !hasOtp)
            return 'Un modèle AUTHENTICATION doit contenir un bouton OTP.';
        if (hasQuickReply && hasCta) return 'Meta interdit de mélanger réponses rapides et boutons URL / téléphone.';
        if (hasCta && buttons.length > 3) return 'Au maximum 3 boutons URL / téléphone.';
        if (!hasCta && buttons.length > 10) return 'Au maximum 10 boutons de réponse rapide.';
        for (const button of buttons) {
            if (button.type === 'URL') {
                if (!/^https:\/\//.test(button.url.trim())) return 'Un bouton URL doit utiliser une adresse https.';
                const hasVariable = /\{\{\s*1\s*\}\}/.test(button.url);
                if (hasVariable && !button.urlExample.trim()) return 'Une URL contenant {{1}} doit fournir un exemple.';
                if (!hasVariable && button.urlExample.trim()) return 'Un exemple d’URL n’est utile que si l’URL contient {{1}}.';
            }
            if (button.type === 'PHONE_NUMBER' && !/^\+?[\d\s-]{6,20}$/.test(button.phoneNumber.trim()))
                return 'Numéro de téléphone du bouton invalide.';
        }
        return null;
    }

    createTemplate(): void
    {
        const error = this._validateDraft();
        if (error) {
            this._toastr.error(error, 'Modèle');
            return;
        }
        const buttons = this.draft.buttons.map((button) => ({
            type       : button.type,
            text       : button.text.trim(),
            ...(button.type === 'URL' ? {
                url       : button.url.trim(),
                ...(button.urlExample.trim() ? { urlExample: button.urlExample.trim() } : {}),
            } : {}),
            ...(button.type === 'PHONE_NUMBER' ? { phoneNumber: button.phoneNumber.trim() } : {}),
        }));
        this.creating = true;
        const payload = {
            name          : this.draft.name.trim().toLowerCase(),
            language      : this.draft.language,
            category      : this.draft.category,
            body          : this.draft.body.trim(),
            bodyExamples  : this.draft.bodyExamples.map((value) => value.trim()),
            headerFormat  : this.draft.headerFormat,
            headerText    : this.draft.headerText.trim() || undefined,
            headerMediaUrl: this.draft.headerMediaUrl.trim() || undefined,
            footer        : this.draft.footer.trim() || undefined,
            buttons       : buttons.length ? buttons : undefined,
        };
        const wasEditing = !!this.editing;
        const request = this.editing
            ? this._organizationService.updateTemplate(this.editing.name, this.editing.language, payload)
            : this._organizationService.createTemplate(payload);
        request.subscribe({
            next : () => {
                this.creating = false;
                this.showCreate = false;
                this.editing = null;
                this._toastr.success(
                    wasEditing
                        ? 'Modèle modifié : Meta le remet en revue. Le statut se met à jour automatiquement.'
                        : 'Modèle soumis à Meta : la validation prend de quelques minutes à 24 h. Le statut se met à jour automatiquement.',
                    'Modèle',
                );
                this.refreshTemplates(true);
                this._cdr.markForCheck();
            },
            error: (errorResponse) => {
                this.creating = false;
                this._toastr.error(readApiError(errorResponse), 'Modèle');
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
                    this.refreshTemplates(true);
                },
                error: (error) => this._toastr.error(readApiError(error), 'Modèles'),
            });
        });
    }

    private _emptyDraft()
    {
        return {
            name          : '',
            language      : 'fr',
            category      : 'MARKETING',
            body          : '',
            bodyExamples  : [] as string[],
            headerFormat  : 'NONE',
            headerText    : '',
            headerMediaUrl: '',
            footer        : '',
            buttons       : [] as ButtonDraft[],
        };
    }
}
