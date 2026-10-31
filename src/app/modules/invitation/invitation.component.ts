import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import { InvitationPreview, ORG_ROLE_LABELS } from 'app/core/organization/organization.types';
import { WalletService } from 'app/core/wallet/wallet.service';
import { ToastrService } from 'ngx-toastr';
import { catchError, of } from 'rxjs';

/**
 * Lien d'invitation recu par email : apercu public, puis acceptation avec le
 * compte NufiSend de l'adresse invitee (connexion ou inscription au besoin).
 */
@Component({
    selector       : 'app-invitation',
    templateUrl    : './invitation.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvitationComponent implements OnInit
{
    token = '';
    preview: InvitationPreview | null = null;
    error = '';
    loading = true;
    accepting = false;
    authenticated = false;
    currentEmail = '';

    readonly roleLabels = ORG_ROLE_LABELS;

    constructor(
        private _route: ActivatedRoute,
        private _router: Router,
        private _authService: AuthService,
        private _organizationService: OrganizationService,
        private _navigationService: NavigationService,
        private _walletService: WalletService,
        private _toastr: ToastrService,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this.token = this._route.snapshot.paramMap.get('token') || '';
        this._authService.check().pipe(catchError(() => of(false))).subscribe((authenticated) => {
            this.authenticated = !!authenticated;
            this.currentEmail = String(this._authService.user?.email || '').toLowerCase();
            this._cdr.markForCheck();
        });
        this._organizationService.previewInvitation(this.token).subscribe({
            next : (preview) => {
                this.preview = preview;
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.error = readApiError(error, 'Invitation introuvable');
                this.loading = false;
                this._cdr.markForCheck();
            },
        });
    }

    get redirectURL(): string
    {
        return `/invitations/${this.token}`;
    }

    get usable(): boolean
    {
        return !!this.preview && this.preview.status === 'pending' && !this.preview.expired;
    }

    get wrongAccount(): boolean
    {
        return this.authenticated && !!this.preview && !!this.currentEmail
            && this.currentEmail !== String(this.preview.email || '').toLowerCase();
    }

    accept(): void
    {
        this.accepting = true;
        this._organizationService.acceptInvitation(this.token).subscribe({
            next : (membership) => {
                this.accepting = false;
                this._navigationService.applyAccess({
                    isSuperAdmin: this._authService.user?.['role'] === 'ADMIN',
                    isMember    : !!membership,
                });
                this._walletService.refresh().subscribe({ error: () => undefined });
                this._toastr.success(`Bienvenue dans ${this.preview?.organizationName || "l'organisation"}`, 'Invitation acceptée');
                this._router.navigate(['/organisation/overview']);
            },
            error: (error) => {
                this.accepting = false;
                this._toastr.error(readApiError(error), 'Invitation');
                this._cdr.markForCheck();
            },
        });
    }

    signOutAndSwitch(): void
    {
        this._authService.signOut().subscribe(() => {
            this._router.navigate(['/auth/sign-in'], { queryParams: { redirectURL: this.redirectURL } });
        });
    }
}
