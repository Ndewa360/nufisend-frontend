import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup } from "@angular/forms";
import { Router } from "@angular/router";
import { Select } from "@ngxs/store";
import { UserProfileModel, UserProfileState } from "app/shared/store/user-profile";
import { PreferencesService, WorkspacePreferences } from "app/shared/services/preferences/preferences.service";
import { ToastrService } from "ngx-toastr";
import { Observable, Subject, takeUntil } from "rxjs";

@Component({
    selector: "app-organisation-settings",
    templateUrl: "./settings.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganisationSettingsComponent implements OnInit, OnDestroy
{
    @Select(UserProfileState.selectStateData) profile$: Observable<UserProfileModel>;

    profile: UserProfileModel = null;
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
        private _changeDetectorRef: ChangeDetectorRef
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

        this.profile$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((profile) => {
                this.profile = profile;
                this._changeDetectorRef.markForCheck();
            });
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
        this._router.navigate(["/sync_whatsapp"]);
    }
}
