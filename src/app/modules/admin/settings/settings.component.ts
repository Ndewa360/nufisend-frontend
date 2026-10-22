import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { AbstractControl, UntypedFormBuilder, UntypedFormGroup, ValidationErrors, ValidatorFn, Validators } from "@angular/forms";
import { Router } from "@angular/router";
import { Actions, Select, Store, ofActionCompleted, ofActionErrored } from "@ngxs/store";
import { User } from "app/core/auth/auth.service";
import { AuthService } from "app/core/auth/auth.service";
import { UserService } from "app/core/user/user.service";
import { UserProfileAction, UserProfileModel, UserProfileState } from "app/shared/store/user-profile";
import { ToastrService } from "ngx-toastr";
import { Observable, Subject, takeUntil } from "rxjs";

const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const newPassword = control.get("newPassword")?.value;
    const confirmation = control.get("confirmPassword")?.value;
    return newPassword && confirmation && newPassword !== confirmation
        ? { passwordMismatch: true }
        : null;
};

@Component({
    selector: "app-settings",
    templateUrl: "./settings.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsComponent implements OnInit, OnDestroy
{
    @Select(UserProfileState.selectStateLoading) loading$: Observable<boolean>;

    profile: UserProfileModel = null;
    user: User = null;
    profileForm: UntypedFormGroup;
    passwordForm: UntypedFormGroup;
    submitted = false;
    changingPassword = false;
    hidePassword = true;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _store: Store,
        private _actions: Actions,
        private _userService: UserService,
        private _authService: AuthService,
        private _toastrService: ToastrService,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef
    )
    {
    }

    ngOnInit(): void
    {
        this.profileForm = this._formBuilder.group({
            firstName: [""],
            lastName: [""],
            country: [""],
            location: [""],
            phoneNumber: [""],
            profilePicture: [""]
        });

        this.passwordForm = this._formBuilder.group({
            currentPassword: ["", [Validators.required]],
            newPassword: ["", [Validators.required, Validators.minLength(8)]],
            confirmPassword: ["", [Validators.required]]
        }, { validators: passwordMatchValidator });

        this._store.select(UserProfileState.selectStateData)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((profile) => {
                this.profile = profile ? { ...profile } : null;
                if (profile) {
                    this.profileForm.patchValue(profile, { emitEvent: false });
                }
                this._changeDetectorRef.markForCheck();
            });

        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user) => {
                this.user = user;
                this._changeDetectorRef.markForCheck();
            });

        this._actions.pipe(
            takeUntil(this._unsubscribeAll),
            ofActionCompleted(UserProfileAction.UpdateUserProfile)
        ).subscribe(() => {
            this.submitted = false;
            this._changeDetectorRef.markForCheck();
        });

        this._actions.pipe(
            takeUntil(this._unsubscribeAll),
            ofActionErrored(UserProfileAction.UpdateUserProfile)
        ).subscribe(() => {
            this.submitted = false;
            this._changeDetectorRef.markForCheck();
        });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    saveProfile(): void
    {
        this.submitted = true;
        if (this.profileForm.invalid) return;

        const profileId = this.profile?._id || this.user?._id;
        if (!profileId) {
            this._toastrService.error("Profil utilisateur introuvable", "Erreur");
            return;
        }

        const payload: UserProfileModel = {};
        Object.entries(this.profileForm.getRawValue()).forEach(([key, value]) => {
            if (value === null || value === undefined) return;
            const normalized = typeof value === "string" ? value.trim() : value;
            if (normalized !== "") (payload as any)[key] = normalized;
        });

        this._store.dispatch(new UserProfileAction.UpdateUserProfile(payload, profileId));
    }

    changePassword(): void
    {
        if (this.passwordForm.invalid) {
            this.passwordForm.markAllAsTouched();
            return;
        }

        this.changingPassword = true;
        const { currentPassword, newPassword } = this.passwordForm.getRawValue();

        this._authService.changePassword({ currentPassword, newPassword }).subscribe({
            next: () => {
                this.changingPassword = false;
                this.passwordForm.reset();
                this._toastrService.success("Mot de passe modifié avec succès", "Sécurité");
                this._changeDetectorRef.markForCheck();
            },
            error: (error) => {
                this.changingPassword = false;
                this._toastrService.error(this._readError(error), "Erreur");
                this._changeDetectorRef.markForCheck();
            }
        });
    }

    goToWhatsappSync(): void
    {
        this._router.navigate(["/sync_whatsapp"]);
    }

    private _readError(error: any): string
    {
        const message = error?.error?.message;
        return Array.isArray(message) ? message.join(", ") : (message || "Une erreur est survenue");
    }
}
