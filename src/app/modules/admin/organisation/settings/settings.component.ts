import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { PreferencesService, WorkspacePreferences } from "app/shared/services/preferences/preferences.service";
import { OrganizationService } from "app/core/organization/organization.service";
import { Membership, WhatsappConnectionStatus } from "app/core/organization/organization.types";
import { ToastrService } from "ngx-toastr";
import { Subject, takeUntil } from "rxjs";

@Component({
    selector: "app-organisation-settings",
    templateUrl: "./settings.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganisationSettingsComponent implements OnInit, OnDestroy
{
    membership: Membership | null | undefined = undefined;
    preferences: WorkspacePreferences;
    preferencesForm: UntypedFormGroup;
    timezones = [
        "Africa/Douala",
        "Africa/Lagos",
        "Africa/Abidjan",
        "Africa/Nairobi",
        "Europe/Paris",
        "UTC"
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _preferencesService: PreferencesService,
        private _toastrService: ToastrService,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef,
        private _organizationService: OrganizationService
    )
    {
    }

    ngOnInit(): void
    {
        this.preferences = this._preferencesService.get();
        if (!this.timezones.includes(this.preferences.timezone)) {
            this.timezones.push(this.preferences.timezone);
        }

        this.preferencesForm = this._formBuilder.group({
            timezone: [this.preferences.timezone],
            defaultCountry: [this.preferences.defaultCountry]
        });

        this._organizationService.membership$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((membership) => {
                this.membership = membership;
                this._changeDetectorRef.markForCheck();
            });
    }

    /** Etat du numero WhatsApp Business de l'organisation (affiche dans la carte WhatsApp). */
    get whatsappStatus(): WhatsappConnectionStatus | null
    {
        return this.membership?.organization?.whatsapp?.status ?? null;
    }

    get whatsappStatusLabel(): string
    {
        if (this.membership === undefined) return 'Chargement...';
        if (!this.membership?.organization) return 'Aucune organisation';
        switch (this.whatsappStatus) {
            case 'connected': return 'Connecté';
            case 'credit_line_missing': return 'Ligne de crédit manquante';
            case 'error': return 'Erreur de connexion';
            default: return 'Non connecté';
        }
    }

    get whatsappStatusClass(): string
    {
        return this.whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-amber-500';
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    save(): void
    {
        const value = this.preferencesForm.getRawValue();
        this.preferences = this._preferencesService.save({
            timezone: value.timezone,
            defaultCountry: String(value.defaultCountry || "").trim().toLowerCase()
        });
        this._toastrService.success("Paramètres de l'espace enregistrés", "Organisation");
        this._changeDetectorRef.markForCheck();
    }

    goToWhatsappSync(): void
    {
        this._router.navigate(["/organisation/whatsapp"]);
    }
}
