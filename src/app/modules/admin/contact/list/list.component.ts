import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { ContactAction, ContactModel, ContactState, GlobalState } from 'app/shared/store';
import { ContactService } from 'app/shared/store/contact/contact.service';
import { Observable, Subject, takeUntil, switchMap, fromEvent, filter, tap } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import { Select, Store } from '@ngxs/store';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ToastrService } from 'ngx-toastr';
import { NewMessageForSingleContactComponent } from '../../messagerie/components/new-message-for-single-contact/new-message-for-single-contact.component';
import { MatDialog } from '@angular/material/dialog';
import { UploadFileComponent } from '../components/upload-file/upload-file.component';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { isChannelReady, resolveMessagingChannel } from 'app/core/organization/messaging-channel';

@Component({
  selector: 'app-contact-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation  : ViewEncapsulation.None,
})
export class ListComponent implements OnInit, OnDestroy{
  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    @Select(GlobalState.selectStateConnectedWhatsApp) hasWhatsAppConnected$:Observable<boolean>;
    @Select(GlobalState.isWhatsAppReady) isWhatsAppReady$:Observable<boolean>;
    @Select(GlobalState.isWhatsAppSyncing) isWhatsAppSyncing$:Observable<boolean>;
    
    @Select(ContactState.selectStateData) contacts$: Observable<ContactModel[]>;
    @Select(ContactState.selectStateLoading) loading$:Observable<boolean>
    loadingData:boolean=true;

    contactsCount: number = 0;
    contactsFiltered:ContactModel[]=[]
    contacts:ContactModel[]=[]
    contactsTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    countries: [];//Country
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedContact: ContactModel;
    hasWhatsAppConnected:boolean=false;
    isWhatsAppReady:boolean=false;
    isWhatsAppSyncing:boolean=false;
    /** Adhesion : undefined = non chargee, null = compte personnel, objet = membre. */
    membership: Membership | null | undefined = undefined;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _contactsService: ContactService,
        @Inject(DOCUMENT) private _document: any,
        private _store: Store,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toastrService:ToastrService,
        private _matDialog: MatDialog, 
        private _organizationService: OrganizationService,
    )
    {
    }

    /** Vrai si l'utilisateur peut envoyer un message a un contact (canal organisation ou personnel). */
    get canSend(): boolean
    {
        return isChannelReady(this.membership, this.isWhatsAppReady);
    }

    get sendBlockedReason(): string
    {
        switch (resolveMessagingChannel(this.membership)) {
            case 'cloud': return "L'organisation ne peut pas envoyer pour le moment (numéro WhatsApp Business ou ligne de crédit)";
            case 'personal':
                return this.isWhatsAppSyncing
                    ? 'Synchronisation WhatsApp en cours...'
                    : 'Synchronisez votre compte WhatsApp pour envoyer un message';
            default: return "Espace d'envoi en cours de chargement";
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Get the contacts
        this._store.dispatch(new ContactAction.FetchAllContact())

        this.hasWhatsAppConnected$
            .pipe(takeUntil(this._unsubscribeAll)).subscribe((value)=>this.hasWhatsAppConnected=value)

        this.isWhatsAppReady$
            .pipe(takeUntil(this._unsubscribeAll)).subscribe((value)=>{
                this.isWhatsAppReady=!!value;
                this._changeDetectorRef.markForCheck();
            })

        this.isWhatsAppSyncing$
            .pipe(takeUntil(this._unsubscribeAll)).subscribe((value)=>{
                this.isWhatsAppSyncing=!!value;
                this._changeDetectorRef.markForCheck();
            })

        this._organizationService.membership$
            .pipe(takeUntil(this._unsubscribeAll)).subscribe((membership)=>{
                this.membership=membership;
                this._changeDetectorRef.markForCheck();
            })

        this.contacts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((conts: ContactModel[]) => {
                this.contactsCount = conts.length;
                const sorted = this._sortAlpha([...conts]);
                this.contactsFiltered = sorted;
                this.contacts = sorted;
                this._changeDetectorRef.markForCheck();
            });


        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((query: string) => this._filterContacts(query));

        // Subscribe to MatDrawer opened change
        this.matDrawer.openedChange.subscribe((opened) => {
            if ( !opened )
            {
                // Remove the selected contact when drawer closed
                this.selectedContact = null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

        // Subscribe to media changes
        // this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe((state) => {

        //         // Calculate the drawer mode
        //         this.drawerMode = state.matches ? 'side' : 'over';

        //         // Mark for check
        //         this._changeDetectorRef.markForCheck();
        //     });
    
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {

                // Set the drawerMode if the given breakpoint is active
                if ( matchingAliases.includes('lg') )
                {
                    this.drawerMode = 'side';
                }
                else
                {
                    this.drawerMode = 'over';
                }

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for shortcuts
        fromEvent(this._document, 'keydown')
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter<KeyboardEvent>(event =>
                    (event.ctrlKey === true || event.metaKey) // Ctrl or Cmd
                    && (event.key === '/') // '/'
                )
            )
            .subscribe(() => {
                this.createContact();
            });

            this._changeDetectorRef.markForCheck();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
    openModelForMessageTo(event,contact)
    {
        event.stopPropagation();
        if (!this.canSend) {
            this._toastrService.warning(this.sendBlockedReason, 'Envoi indisponible');
            return;
        }
        const dialogRef = this._matDialog.open(NewMessageForSingleContactComponent,
            {
                data: {contact}
            }
            // {
            //   height: '100%',
            //   minWidth: '100%',
            // }
            );

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    selectContact(contact)
    {
        this.selectedContact= contact
        // Go back to the list
        this._router.navigate(['./',contact._id], {relativeTo: this._activatedRoute});
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create contact
     */
    createContact(): void
    {
        // Create the contact

            // Go to the new contact
            this._router.navigate(['./new'], {relativeTo: this._activatedRoute});

            // Mark for check
            this._changeDetectorRef.markForCheck();
    }

    /**
     * Import contact
     */
    importContact(): void
    {
        // Import the contact
        const dialogRef = this._matDialog.open(UploadFileComponent,
            {
              height: '100%',
              minWidth: '100%',
            }
            );
    }

    /**
     * Export contact
     */
    exportContact(): void
    {
        // Create the contact

            // Go to the new contact
            // this._router.navigate(['./import'], {relativeTo: this._activatedRoute});

            // Mark for check
            // this._changeDetectorRef.markForCheck();

            this._toastrService.warning("Fonctionnalité d'import non encore supporté", 'Contact');
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item._id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _filterContacts(query: string): void
    {
        const normalizedQuery = this._normalize(query);

        if ( !normalizedQuery )
        {
            this.contactsFiltered = this._sortAlpha([...this.contacts]);
        }
        else
        {
            this.contactsFiltered = this._sortAlpha(this.contacts.filter((contact) => {
                const emails = (contact.emails || []).map((email) => email.email).join(' ');
                const phones = (contact.phoneNumbers || []).map((phone) => phone.phoneNumber).join(' ');

                return this._normalize([
                    contact.fullName,
                    contact.jobTitle,
                    contact.company,
                    contact.organization,
                    contact.address,
                    emails,
                    phones
                ].filter(Boolean).join(' ')).includes(normalizedQuery);
            }));
        }

        this._changeDetectorRef.markForCheck();
    }

    private _sortAlpha(contacts: ContactModel[]): ContactModel[]
    {
        return contacts.sort((a, b) =>
            (a.fullName || '').localeCompare(b.fullName || '', 'fr', { sensitivity: 'base' })
        );
    }

    private _normalize(value: string | undefined | null): string
    {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim();
    }
}
