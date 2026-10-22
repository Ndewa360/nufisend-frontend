import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Actions, Select, Store, ofActionCompleted, ofActionSuccessful } from '@ngxs/store';
import { WhatsappDataService } from 'app/shared/services/whatsapp/whatsapp-data.service';
import { ContactState, ContactModel, ContactAction, WhatsappContactModel, WhatsappContactState } from 'app/shared/store';
import { ContactService } from 'app/shared/store/contact/contact.service';
import { UserProfileState, UserProfileModel } from 'app/shared/store/user-profile';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, combineLatest, combineLatestAll, mergeAll, mergeMap, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-whatsapp-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ContactComponent {
  @Select(UserProfileState.selectStateData) userProfile$:Observable<UserProfileModel>
  @Select(UserProfileState.selectStateLoading) loadingUserProfile$:Observable<boolean>
  @Select(WhatsappContactState.selectStateLoading) loadingContactStart$:Observable<boolean>;
  @Select(WhatsappContactState.selectStateData) contactList$:Observable<WhatsappContactModel[]>;
  @Select(WhatsappContactState.selectStatePercent) loadingPercent$:Observable<number>;
  @Select(WhatsappContactState.selectStateSyncError) syncError$:Observable<string>;
  isWhatsappContactLoading=false
  contactsLoading=false;
  userProfile:UserProfileModel=null;
  percent=0;

  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    contacts: WhatsappContactModel[];
    contactsFiltered:WhatsappContactModel[]=[]
    submitted:boolean = false;

    
    contactsTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedContact: WhatsappContactModel;
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
        private whatsappDataService: WhatsappDataService,
        private _ngxsAction:Actions

    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // this.contacts$ = this._contactsService.contacts$;
        this.loadingContactStart$.pipe(takeUntil(this._unsubscribeAll)).subscribe((loading)=>{
            this.contactsLoading=loading;
            this.refreshLoadingState();
        })

        this.userProfile$.pipe(takeUntil(this._unsubscribeAll)).subscribe((profile)=>{
            this.userProfile=profile;
            this.refreshLoadingState();
        })

        this.loadingPercent$.pipe(takeUntil(this._unsubscribeAll)).subscribe((percent)=>{
            this.percent=percent;
            // Mark for check
           this._changeDetectorRef.markForCheck();
        })

        this.contactList$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((data)=> {
          if(data.length==0) return; 
            this.contacts=[...data];
            this.contactsFiltered=[...data]
           // Mark for check
           this._changeDetectorRef.markForCheck();
        })
          
        this._ngxsAction.pipe(
        takeUntil(this._unsubscribeAll),
        ofActionCompleted(ContactAction.SyncContact))
        .subscribe(
            (value) => {
            this.submitted=false
            // Mark for check
            this._changeDetectorRef.markForCheck();
            }
        )
       
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

            // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
        .pipe(
            takeUntil(this._unsubscribeAll),
            tap((query:string) =>
                {
                    if(query.length<2)
                    {
                        this.contactsFiltered=[...this.contacts]
                        return;
                    }
                    // Search
                    this.contactsFiltered=this.contacts.filter
                        (
                            (contact)=> `${contact.name} ${contact.number}`.toLowerCase().includes(query.toLowerCase())
                        )
                        this._changeDetectorRef.markForCheck();
                }
            )
        )
        .subscribe();
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

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Clear the selected contact
        this.selectedContact = null;

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * A user that is not synced with WhatsApp should never see the loading
     * placeholder: only synced users load their WhatsApp contacts.
     */
    refreshLoadingState()
    {
        this.isWhatsappContactLoading = !this.userProfile || (!!this.userProfile.hasSyncWhatsApp && this.contactsLoading);
        this._changeDetectorRef.markForCheck();
    }

    

    selectContact(contact)
    {
        this.selectedContact= contact
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Sync contacts
     */
    syncContact(): void
    {
        // Create the contact

            this.submitted=true;
            this._store.dispatch(new ContactAction.SyncContact())

            // Mark for check
            this._changeDetectorRef.markForCheck();
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }
}
