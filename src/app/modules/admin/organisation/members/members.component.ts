import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { UserService } from 'app/core/user/user.service';
import { OrganizationService, readApiError } from 'app/core/organization/organization.service';
import {
    Membership,
    ORG_ROLE_LABELS,
    OrgRole,
    OrganizationInvitation,
    OrganizationMember,
} from 'app/core/organization/organization.types';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';

/** Membres de l'organisation, roles et invitations par email. */
@Component({
    selector       : 'app-organisation-members',
    templateUrl    : './members.component.html',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationMembersComponent implements OnInit, OnDestroy
{
    membership: Membership | null = null;
    members: OrganizationMember[] = [];
    invitations: OrganizationInvitation[] = [];
    currentUserId: string | null = null;
    loading = false;
    inviting = false;
    inviteEmail = '';
    inviteRole: OrgRole = 'member';

    readonly roleLabels = ORG_ROLE_LABELS;
    readonly assignableRoles: OrgRole[] = ['member', 'admin'];

    private _unsubscribeAll = new Subject<void>();

    constructor(
        private _organizationService: OrganizationService,
        private _userService: UserService,
        private _confirmation: FuseConfirmationService,
        private _toastr: ToastrService,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    ngOnInit(): void
    {
        this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe((user: any) => {
            this.currentUserId = user?._id ? String(user._id) : null;
            this._cdr.markForCheck();
        });
        this._organizationService.loadedMembership$.pipe(takeUntil(this._unsubscribeAll)).subscribe((membership) => {
            this.membership = membership;
            this._cdr.markForCheck();
        });
        this.reload();
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    get isOwner(): boolean
    {
        return this.membership?.role === 'owner';
    }

    get seatsLeft(): number
    {
        const max = this.membership?.maxMembers ?? 0;
        return Math.max(0, max - this.members.length - this.invitations.length);
    }

    reload(): void
    {
        this.loading = true;
        this._organizationService.members().subscribe({
            next : (members) => {
                this.members = members;
                this.loading = false;
                this._cdr.markForCheck();
            },
            error: (error) => {
                this.loading = false;
                this._toastr.error(readApiError(error), 'Membres');
                this._cdr.markForCheck();
            },
        });
        if (this._organizationService.membership?.isManager) {
            this._organizationService.invitations().subscribe({
                next : (invitations) => {
                    this.invitations = invitations;
                    this._cdr.markForCheck();
                },
                error: () => undefined,
            });
        }
    }

    /** Un administrateur ne gere que les membres ; le proprietaire gere tout le monde. */
    canManage(member: OrganizationMember): boolean
    {
        if (!this.membership?.isManager || member.role === 'owner') return false;
        if (String(member.userId) === this.currentUserId) return false;
        return this.isOwner || member.role === 'member';
    }

    invite(): void
    {
        const email = this.inviteEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            this._toastr.error('Adresse email invalide', 'Invitation');
            return;
        }
        this.inviting = true;
        this._organizationService.invite(email, this.inviteRole).subscribe({
            next : () => {
                this.inviting = false;
                this.inviteEmail = '';
                this._toastr.success(`Invitation envoyée à ${email} (valable 7 jours)`, 'Invitation');
                this.reload();
                this._organizationService.load().subscribe();
            },
            error: (error) => {
                this.inviting = false;
                this._toastr.error(readApiError(error), 'Invitation');
                this._cdr.markForCheck();
            },
        });
    }

    changeRole(member: OrganizationMember, role: OrgRole): void
    {
        if (role === member.role) return;
        this._organizationService.changeRole(String(member.userId), role).subscribe({
            next : () => {
                this._toastr.success('Rôle mis à jour', 'Membres');
                this.reload();
            },
            error: (error) => this._toastr.error(readApiError(error), 'Membres'),
        });
    }

    transferOwnership(member: OrganizationMember): void
    {
        this._confirmation.open({
            title  : 'Transférer la propriété',
            message: `${this.displayName(member)} deviendra propriétaire de l'organisation et vous deviendrez administrateur.`,
            actions: { confirm: { label: 'Transférer' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;
            this._organizationService.changeRole(String(member.userId), 'owner').subscribe({
                next : () => {
                    this._toastr.success('Propriété transférée', 'Membres');
                    this._organizationService.load().subscribe();
                    this.reload();
                },
                error: (error) => this._toastr.error(readApiError(error), 'Membres'),
            });
        });
    }

    remove(member: OrganizationMember): void
    {
        this._confirmation.open({
            title  : 'Retirer le membre',
            message: `${this.displayName(member)} n'aura plus accès à l'organisation. Ses messages programmés pour l'organisation seront arrêtés ; il pourra rejoindre une autre organisation.`,
            actions: { confirm: { label: 'Retirer' }, cancel: { label: 'Annuler' } },
        }).afterClosed().subscribe((result) => {
            if (result !== 'confirmed') return;
            this._organizationService.removeMember(String(member.userId)).subscribe({
                next : () => {
                    this._toastr.success('Membre retiré', 'Membres');
                    this._organizationService.load().subscribe();
                    this.reload();
                },
                error: (error) => this._toastr.error(readApiError(error), 'Membres'),
            });
        });
    }

    resend(invitation: OrganizationInvitation): void
    {
        this._organizationService.resendInvitation(invitation._id).subscribe({
            next : () => {
                this._toastr.success(`Invitation renvoyée à ${invitation.email}`, 'Invitation');
                this.reload();
            },
            error: (error) => this._toastr.error(readApiError(error), 'Invitation'),
        });
    }

    revoke(invitation: OrganizationInvitation): void
    {
        this._organizationService.revokeInvitation(invitation._id).subscribe({
            next : () => {
                this._toastr.success('Invitation annulée', 'Invitation');
                this._organizationService.load().subscribe();
                this.reload();
            },
            error: (error) => this._toastr.error(readApiError(error), 'Invitation'),
        });
    }

    displayName(member: OrganizationMember): string
    {
        return [member.firstName, member.lastName].filter(Boolean).join(' ') || member.email;
    }
}
