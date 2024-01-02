import { DOCUMENT } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Actions, Select, Store, ofActionCompleted, ofActionSuccessful } from '@ngxs/store';
import { WhatsappDataService } from 'app/shared/services/whatsapp/whatsapp-data.service';
import { ContactState, ContactModel, ContactAction, WhatsappContact } from 'app/shared/store';
import { ContactService } from 'app/shared/store/contact/contact.service';
import { UserProfileState, UserProfileModel } from 'app/shared/store/user-profile';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, filter, fromEvent, takeUntil } from 'rxjs';

@Component({
  selector: 'app-whatsapp-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {
  @Select(UserProfileState.selectStateData) userProfile$:Observable<UserProfileModel>
  @Select(UserProfileState.selectStateLoading) loadingUserProfile$:Observable<boolean>
  
  isWhatsappContactLoading=true

  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    contacts: WhatsappContact[];
    submitted:boolean = false;

    contactsTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedContact: WhatsappContact;
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
        this.whatsappDataService.whatsappContactList.subscribe((data)=> {
          if(data.length==0) return; 
            this.contacts=[...data];
          console.log("Data ",data) 
          this.isWhatsappContactLoading=false
           // Mark for check
           this._changeDetectorRef.markForCheck();
        })
      
          
          this._ngxsAction.pipe(ofActionCompleted(ContactAction.SyncContact)).subscribe(
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

    

    selectContact(contact)
    {
        this.selectedContact= contact
        // Go back to the list
        this._router.navigate(['./',contact._id], {relativeTo: this._activatedRoute});
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
