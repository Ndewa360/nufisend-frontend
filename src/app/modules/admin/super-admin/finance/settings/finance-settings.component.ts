import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { environment } from 'environments/environment';
import { FinanceApiService } from '../finance-api.service';

/** Tarification et parametres financiers de la plateforme. */
@Component({
    selector       : 'app-finance-settings',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <form *ngIf="loaded" class="flex flex-col gap-6" [formGroup]="form" (ngSubmit)="save()">
            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Tarifs (par destinataire)</div>
                <div class="text-sm text-secondary">Seuls les messages livrés sont facturés. Une modification ne change pas les montants déjà réservés.</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <mat-form-field><mat-label>Message texte (FCFA)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="textPrice"></mat-form-field>
                    <mat-form-field><mat-label>Avec pièce jointe (FCFA)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="attachmentPrice"></mat-form-field>
                    <mat-form-field><mat-label>Messages offerts par mois</mat-label><input matInput type="number" min="0" formControlName="freeMonthlyQuota"></mat-form-field>
                </div>
                <mat-slide-toggle formControlName="tiersEnabled">Tarifs dégressifs selon le nombre de destinataires d'un envoi</mat-slide-toggle>
                <div *ngIf="form.value.tiersEnabled" class="mt-4 flex flex-col gap-2" formArrayName="tiers">
                    <div *ngFor="let tier of tiers.controls; let i = index" [formGroupName]="i" class="flex items-center gap-3">
                        <mat-form-field class="fuse-mat-dense w-48" subscriptSizing="dynamic"><mat-label>À partir de (destinataires)</mat-label><input matInput type="number" min="1" formControlName="minRecipients"></mat-form-field>
                        <mat-form-field class="fuse-mat-dense w-36" subscriptSizing="dynamic"><mat-label>Remise (%)</mat-label><input matInput type="number" min="0" max="90" formControlName="discountPercent"></mat-form-field>
                        <button mat-icon-button type="button" (click)="tiers.removeAt(i)"><mat-icon svgIcon="heroicons_outline:trash"></mat-icon></button>
                    </div>
                    <div><button mat-stroked-button type="button" (click)="addTier()">Ajouter une tranche</button></div>
                </div>
            </div>

            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Campagnes marketing WhatsApp Business</div>
                <div class="text-sm text-secondary">Prix par destinataire du palier atteint par le nombre de destinataires. Le montant minimal d'un palier est le montant maximal du palier précédent : ajouter du volume ne fait jamais baisser le total.</div>
                <div class="mt-4 flex flex-col gap-2" formArrayName="campaignPrices">
                    <div *ngFor="let tier of campaignPrices.controls; let i = index" [formGroupName]="i" class="flex items-center gap-3">
                        <mat-form-field class="fuse-mat-dense w-52" subscriptSizing="dynamic"><mat-label>À partir de (destinataires)</mat-label><input matInput type="number" min="1" formControlName="minRecipients"></mat-form-field>
                        <mat-form-field class="fuse-mat-dense w-44" subscriptSizing="dynamic"><mat-label>Prix unitaire (FCFA)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="unitPrice"></mat-form-field>
                        <button mat-icon-button type="button" (click)="campaignPrices.removeAt(i)"><mat-icon svgIcon="heroicons_outline:trash"></mat-icon></button>
                    </div>
                    <div><button mat-stroked-button type="button" (click)="addCampaignTier()">Ajouter une tranche</button></div>
                </div>
            </div>

            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Messages conversationnels (prix plat par message livré)</div>
                <div class="text-sm text-secondary">Utility, authentification et service sont facturés à l'unité par conversation, sans palier de campagne. « Marketing » sert de repli pour les anciens messages sans grille.</div>
                <div class="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
                    <mat-form-field><mat-label>Marketing (repli, FCFA)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="cloudMarketing"></mat-form-field>
                    <mat-form-field><mat-label>Utility (FCFA)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="cloudUtility"></mat-form-field>
                    <mat-form-field><mat-label>Authentification (FCFA)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="cloudAuthentication"></mat-form-field>
                    <mat-form-field><mat-label>Service (FCFA)</mat-label><input matInput type="number" min="0" step="0.5" formControlName="cloudService"></mat-form-field>
                </div>
            </div>

            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Mode Meta et abonnement par numéro</div>
                <div class="text-sm text-secondary">
                    Mode actuel de la plateforme : <strong>{{ metaModeLabel }}</strong>.
                    Il se règle par la variable META_PARTNER_MODE (redémarrage requis), car il doit correspondre au statut accordé par Meta.
                </div>
                <div class="text-sm text-secondary mt-2">
                    <strong>tech_provider</strong> : abonnement mensuel par numéro raccordé, prélevé sur le portefeuille de l'organisation ; le client paie Meta directement pour ses messages.
                    <strong>solution_partner</strong> : grille par message ci-dessous et ligne de crédit NufiSend ; pas d'abonnement.
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <mat-form-field><mat-label>Abonnement par numéro (FCFA / mois, tech_provider)</mat-label><input matInput type="number" min="0" step="1" formControlName="platformFeePerNumber"></mat-form-field>
                    <mat-form-field><mat-label>Part plateforme par message (FCFA, tech_provider, 0 = aucune)</mat-label><input matInput type="number" min="0" step="1" formControlName="techProviderFee"></mat-form-field>
                </div>
            </div>

            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Coût Meta (USD) et taux de change</div>
                <div class="text-sm text-secondary">
                    Meta facture NufiSend en USD sur la ligne de crédit (Solution Partner). Les clients paient en FCFA via
                    Orange Money / MTN MoMo : le taux ne sert qu'au suivi de marge, jamais à facturer le client.
                    Le XAF est arrimé à l'EUR (1 EUR = 655,957 XAF) : XAF/USD = 655,957 / (USD/EUR). Mettez ce taux à jour régulièrement.
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <mat-form-field><mat-label>Taux (FCFA pour 1 USD)</mat-label><input matInput type="number" min="0" step="1" formControlName="usdToXafRate"></mat-form-field>
                    <mat-form-field><mat-label>Marketing (USD / conversation)</mat-label><input matInput type="number" min="0" step="0.001" formControlName="metaMarketingUsd"></mat-form-field>
                    <mat-form-field><mat-label>Utility (USD)</mat-label><input matInput type="number" min="0" step="0.001" formControlName="metaUtilityUsd"></mat-form-field>
                    <mat-form-field><mat-label>Authentification (USD)</mat-label><input matInput type="number" min="0" step="0.001" formControlName="metaAuthenticationUsd"></mat-form-field>
                    <mat-form-field><mat-label>Service (USD)</mat-label><input matInput type="number" min="0" step="0.001" formControlName="metaServiceUsd"></mat-form-field>
                </div>
                <div class="mt-4 overflow-x-auto">
                    <table class="w-full text-left text-sm">
                        <thead class="text-secondary"><tr><th>Catégorie</th><th>Coût Meta (FCFA)</th><th>Prix de vente (FCFA)</th><th>Marge (FCFA)</th></tr></thead>
                        <tbody>
                            <tr *ngFor="let row of localMargins">
                                <td class="py-1 font-medium">{{ row.label }}</td>
                                <td>{{ row.costXaf }}</td>
                                <td>{{ row.sellingXaf }}</td>
                                <td [ngClass]="row.belowCost ? 'text-red-600 font-semibold' : ''">
                                    {{ row.marginXaf }}<span *ngIf="row.belowCost"> · sous le coût</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Recharges et alertes</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <mat-form-field><mat-label>Recharge minimale (FCFA)</mat-label><input matInput type="number" min="1" formControlName="minTopup"></mat-form-field>
                    <mat-form-field><mat-label>Recharge maximale (FCFA)</mat-label><input matInput type="number" min="1" formControlName="maxTopup"></mat-form-field>
                    <mat-form-field>
                        <mat-label>Frais Easy-Transact (%)</mat-label><input matInput type="number" min="0" step="0.1" formControlName="providerFeePercent">
                        <mat-hint>Utilisé si la réponse n'indique pas les frais</mat-hint>
                    </mat-form-field>
                    <mat-form-field><mat-label>Seuil « solde bas » utilisateur (FCFA)</mat-label><input matInput type="number" min="0" formControlName="lowBalanceThreshold"></mat-form-field>
                    <mat-form-field><mat-label>Écart toléré au rapprochement (FCFA)</mat-label><input matInput type="number" min="0" formControlName="reconciliationTolerance"></mat-form-field>
                    <mat-form-field><mat-label>Emails des alertes financières</mat-label><input matInput formControlName="alertEmails" placeholder="finance@exemple.com, …"></mat-form-field>
                </div>
            </div>

            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Retraits</div>
                <div class="text-sm text-secondary">Garde-fous des retraits vers Mobile Money (super-admin).</div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <mat-form-field><mat-label>Retrait minimal (FCFA)</mat-label><input matInput type="number" min="1" formControlName="minWithdrawal"></mat-form-field>
                    <mat-form-field><mat-label>Retrait maximal (FCFA)</mat-label><input matInput type="number" min="1" formControlName="maxWithdrawal"></mat-form-field>
                    <mat-form-field><mat-label>Plafond sur 24 h (FCFA)</mat-label><input matInput type="number" min="0" formControlName="withdrawalDailyLimit"><mat-hint>0 = sans plafond</mat-hint></mat-form-field>
                    <mat-form-field class="sm:col-span-3">
                        <mat-label>Numéros autorisés</mat-label>
                        <input matInput formControlName="withdrawalAllowedPhones" placeholder="677123456, 699112233">
                        <mat-hint>Vide = tout numéro camerounais. Recommandé : limiter aux numéros de l'entreprise.</mat-hint>
                    </mat-form-field>
                </div>
            </div>

            <div class="bg-card rounded-2xl shadow p-6">
                <div class="text-lg font-semibold">Mentions des reçus</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <mat-form-field><mat-label>Raison sociale</mat-label><input matInput formControlName="companyName"></mat-form-field>
                    <mat-form-field><mat-label>Adresse</mat-label><input matInput formControlName="companyAddress"></mat-form-field>
                    <mat-form-field><mat-label>NIU</mat-label><input matInput formControlName="companyTaxId"></mat-form-field>
                    <mat-form-field><mat-label>RCCM</mat-label><input matInput formControlName="companyRegistry"></mat-form-field>
                    <mat-form-field><mat-label>TVA incluse (%)</mat-label><input matInput type="number" min="0" max="100" step="0.01" formControlName="vatRate"><mat-hint>0 = non applicable</mat-hint></mat-form-field>
                </div>
            </div>

            <div class="flex justify-end">
                <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || saving">Enregistrer les paramètres</button>
            </div>
        </form>
        <mat-progress-bar *ngIf="!loaded" mode="indeterminate"></mat-progress-bar>
    `,
})
export class FinanceSettingsComponent implements OnInit
{
    loaded = false;
    saving = false;

    readonly form = this._fb.group({
        textPrice              : [10, [Validators.required, Validators.min(0)]],
        attachmentPrice        : [12, [Validators.required, Validators.min(0)]],
        freeMonthlyQuota       : [5, [Validators.required, Validators.min(0)]],
        tiersEnabled           : [false],
        tiers                  : this._fb.array([]),
        campaignPrices         : this._fb.array([]),
        cloudMarketing         : [18, [Validators.required, Validators.min(0)]],
        cloudUtility           : [6, [Validators.required, Validators.min(0)]],
        cloudAuthentication    : [6, [Validators.required, Validators.min(0)]],
        cloudService           : [1, [Validators.required, Validators.min(0)]],
        usdToXafRate           : [600, [Validators.required, Validators.min(0)]],
        platformFeePerNumber   : [5000, [Validators.required, Validators.min(0)]],
        techProviderFee        : [0, [Validators.required, Validators.min(0)]],
        metaMarketingUsd       : [0, [Validators.required, Validators.min(0)]],
        metaUtilityUsd         : [0, [Validators.required, Validators.min(0)]],
        metaAuthenticationUsd  : [0, [Validators.required, Validators.min(0)]],
        metaServiceUsd         : [0, [Validators.required, Validators.min(0)]],
        minTopup               : [500, [Validators.required, Validators.min(1)]],
        maxTopup               : [500000, [Validators.required, Validators.min(1)]],
        providerFeePercent     : [1, [Validators.required, Validators.min(0)]],
        minWithdrawal          : [500, [Validators.required, Validators.min(1)]],
        maxWithdrawal          : [500000, [Validators.required, Validators.min(1)]],
        withdrawalDailyLimit   : [0, [Validators.required, Validators.min(0)]],
        withdrawalAllowedPhones: [''],
        lowBalanceThreshold    : [200, [Validators.required, Validators.min(0)]],
        reconciliationTolerance: [1000, [Validators.required, Validators.min(0)]],
        alertEmails            : [''],
        companyName            : [''],
        companyAddress         : [''],
        companyTaxId           : [''],
        companyRegistry        : [''],
        vatRate                : [0, [Validators.min(0), Validators.max(100)]],
    });

    /** Mode Meta lu depuis l'API publique (affichage seulement). */
    metaModeLabel = '...';

    constructor(
        private _api: FinanceApiService,
        private _fb: FormBuilder,
        private _snack: MatSnackBar,
        private _cdr: ChangeDetectorRef,
        private _http: HttpClient,
    ) {}

    get tiers(): FormArray
    {
        return this.form.get('tiers') as FormArray;
    }

    get campaignPrices(): FormArray
    {
        return this.form.get('campaignPrices') as FormArray;
    }

    /** Marge par catégorie recalculée à partir des valeurs saisies. */
    get localMargins(): { label: string; costXaf: number; sellingXaf: number; marginXaf: number; belowCost: boolean }[]
    {
        const v: any = this.form.getRawValue();
        const rate = Number(v.usdToXafRate) || 0;
        const cost = (usd: number): number => Math.ceil((Number(usd) || 0) * rate);
        const tiers = (v.campaignPrices || []) as { unitPrice: number }[];
        const marketing = Number(tiers[0]?.unitPrice ?? 18);
        const rows = [
            { label: 'Marketing', usd: v.metaMarketingUsd, sellingXaf: marketing },
            { label: 'Utility', usd: v.metaUtilityUsd, sellingXaf: Number(v.cloudUtility) || 0 },
            { label: 'Authentification', usd: v.metaAuthenticationUsd, sellingXaf: Number(v.cloudAuthentication) || 0 },
            { label: 'Service', usd: v.metaServiceUsd, sellingXaf: Number(v.cloudService) || 0 },
        ];
        return rows.map((row) =>
        {
            const costXaf = cost(row.usd);
            return {
                label      : row.label,
                costXaf,
                sellingXaf : row.sellingXaf,
                marginXaf  : row.sellingXaf - costXaf,
                belowCost  : costXaf > 0 && row.sellingXaf < costXaf,
            };
        });
    }

    ngOnInit(): void
    {
        this._http.get<any>(`${environment.apiUrl}/billing/pricing`).subscribe({
            next : (response) => {
                this.metaModeLabel = response?.data?.mode ?? 'inconnu';
                this._cdr.markForCheck();
            },
            error: () => {
                this.metaModeLabel = 'inconnu';
                this._cdr.markForCheck();
            },
        });
        this._api.settings().subscribe((settings) => {
            this.tiers.clear();
            (settings.tiers || []).forEach((tier) => this.addTier(tier.minRecipients, tier.discountPercent));
            this.campaignPrices.clear();
            const campaignPrices = settings.campaignPrices?.length
                ? settings.campaignPrices
                : [{ minRecipients: 1, unitPrice: 18 }, { minRecipients: 1001, unitPrice: 17 }, { minRecipients: 3001, unitPrice: 16 }, { minRecipients: 5001, unitPrice: 16 }];
            campaignPrices.forEach((tier) => this.addCampaignTier(tier.minRecipients, tier.unitPrice));
            const cloud = settings.cloudPrices || {};
            this.form.patchValue({
                ...settings,
                tiers          : undefined,
                campaignPrices : undefined,
                cloudMarketing : cloud.marketing ?? 18,
                cloudUtility   : cloud.utility ?? 6,
                cloudAuthentication: cloud.authentication ?? 6,
                cloudService   : cloud.service ?? 1,
                usdToXafRate   : settings.usdToXafRate ?? 600,
                metaMarketingUsd     : (settings.metaCostsUsd || {}).marketing ?? 0,
                metaUtilityUsd       : (settings.metaCostsUsd || {}).utility ?? 0,
                metaAuthenticationUsd: (settings.metaCostsUsd || {}).authentication ?? 0,
                metaServiceUsd       : (settings.metaCostsUsd || {}).service ?? 0,
            } as any);
            this.loaded = true;
            this._cdr.markForCheck();
        });
    }

    addCampaignTier(minRecipients = 1, unitPrice = 18): void
    {
        this.campaignPrices.push(
            this._fb.group({
                minRecipients: [minRecipients, [Validators.required, Validators.min(1)]],
                unitPrice    : [unitPrice, [Validators.required, Validators.min(0)]],
            }),
        );
    }

    addTier(minRecipients = 100, discountPercent = 5): void
    {
        this.tiers.push(
            this._fb.group({
                minRecipients  : [minRecipients, [Validators.required, Validators.min(1)]],
                discountPercent: [discountPercent, [Validators.required, Validators.min(0), Validators.max(90)]],
            }),
        );
    }

    save(): void
    {
        const value: any = this.form.getRawValue();
        for (const key of Object.keys(value))
            if (typeof value[key] === 'string' && value[key] !== '' && !isNaN(Number(value[key])) && !['alertEmails', 'withdrawalAllowedPhones', 'companyName', 'companyAddress', 'companyTaxId', 'companyRegistry'].includes(key))
                value[key] = Number(value[key]);
        value.tiers = (value.tiers || []).map((tier: any) => ({
            minRecipients  : Number(tier.minRecipients),
            discountPercent: Number(tier.discountPercent),
        }));
        value.campaignPrices = (value.campaignPrices || []).map((tier: any) => ({
            minRecipients: Number(tier.minRecipients),
            unitPrice    : Number(tier.unitPrice),
        }));
        value.cloudPrices = {
            marketing     : Number(value.cloudMarketing),
            utility       : Number(value.cloudUtility),
            authentication: Number(value.cloudAuthentication),
            service       : Number(value.cloudService),
        };
        delete value.cloudMarketing;
        delete value.cloudUtility;
        delete value.cloudAuthentication;
        delete value.cloudService;
        value.metaCostsUsd = {
            marketing     : Number(value.metaMarketingUsd),
            utility       : Number(value.metaUtilityUsd),
            authentication: Number(value.metaAuthenticationUsd),
            service       : Number(value.metaServiceUsd),
        };
        delete value.metaMarketingUsd;
        delete value.metaUtilityUsd;
        delete value.metaAuthenticationUsd;
        delete value.metaServiceUsd;
        delete value.metaMargins;
        this.saving = true;
        this._api.updateSettings(value).subscribe({
            next : () => {
                this.saving = false;
                this._snack.open('Paramètres enregistrés', 'OK', { duration: 3000 });
                this._cdr.markForCheck();
            },
            error: (err) => {
                this.saving = false;
                const message = err?.error?.message;
                this._snack.open(Array.isArray(message) ? message.join(' ') : message || 'Erreur', 'OK', { duration: 5000 });
                this._cdr.markForCheck();
            },
        });
    }
}
