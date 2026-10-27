import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
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
        minTopup               : [500, [Validators.required, Validators.min(1)]],
        maxTopup               : [500000, [Validators.required, Validators.min(1)]],
        providerFeePercent     : [1, [Validators.required, Validators.min(0)]],
        lowBalanceThreshold    : [200, [Validators.required, Validators.min(0)]],
        reconciliationTolerance: [1000, [Validators.required, Validators.min(0)]],
        alertEmails            : [''],
        companyName            : [''],
        companyAddress         : [''],
        companyTaxId           : [''],
        companyRegistry        : [''],
        vatRate                : [0, [Validators.min(0), Validators.max(100)]],
    });

    constructor(
        private _api: FinanceApiService,
        private _fb: FormBuilder,
        private _snack: MatSnackBar,
        private _cdr: ChangeDetectorRef,
    ) {}

    get tiers(): FormArray
    {
        return this.form.get('tiers') as FormArray;
    }

    ngOnInit(): void
    {
        this._api.settings().subscribe((settings) => {
            this.tiers.clear();
            (settings.tiers || []).forEach((tier) => this.addTier(tier.minRecipients, tier.discountPercent));
            this.form.patchValue({ ...settings, tiers: undefined } as any);
            this.loaded = true;
            this._cdr.markForCheck();
        });
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
            if (typeof value[key] === 'string' && value[key] !== '' && !isNaN(Number(value[key])) && !['alertEmails', 'companyName', 'companyAddress', 'companyTaxId', 'companyRegistry'].includes(key))
                value[key] = Number(value[key]);
        value.tiers = (value.tiers || []).map((tier: any) => ({
            minRecipients  : Number(tier.minRecipients),
            discountPercent: Number(tier.discountPercent),
        }));
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
