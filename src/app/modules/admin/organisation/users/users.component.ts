import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { User } from "app/core/auth/auth.service";
import { UserService } from "app/core/user/user.service";
import { UserProfileModel } from "app/shared/store/user-profile";
import { UserProfileService } from "app/shared/store/user-profile/user-profile.service";
import { ToastrService } from "ngx-toastr";
import { Subject, takeUntil } from "rxjs";

@Component({
    selector: "app-organisation-users",
    templateUrl: "./users.component.html",
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrganisationUsersComponent implements OnInit, OnDestroy
{
    users: UserProfileModel[] = [];
    currentUser: User = null;
    loading = false;
    displayedColumns: string[] = ["name", "email", "phone", "whatsapp", "actions"];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _userProfileService: UserProfileService,
        private _userService: UserService,
        private _toastrService: ToastrService,
        private _router: Router,
        private _changeDetectorRef: ChangeDetectorRef
    )
    {
    }

    ngOnInit(): void
    {
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((user) => {
                this.currentUser = user;
                this._changeDetectorRef.markForCheck();
            });

        this.loadUsers();
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadUsers(): void
    {
        this.loading = true;
        this._userProfileService.getUsers()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (result) => {
                    this.users = result.data || [];
                    this.loading = false;
                    this._changeDetectorRef.markForCheck();
                },
                error: (error) => {
                    this.loading = false;
                    this._toastrService.error(this._readError(error), "Erreur");
                    this._changeDetectorRef.markForCheck();
                }
            });
    }

    goToProfile(user: UserProfileModel): void
    {
        if (user?._id === this.currentUser?._id) {
            this._router.navigate(["/settings"]);
        }
    }

    goToWhatsapp(): void
    {
        this._router.navigate(["/sync_whatsapp"]);
    }

    private _readError(error: any): string
    {
        const message = error?.error?.message;
        return Array.isArray(message) ? message.join(", ") : (message || "Une erreur est survenue");
    }
}
