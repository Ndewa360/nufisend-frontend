import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { ContactAction, ContactModel, ContactState } from 'app/shared/store';
import { ContactService } from 'app/shared/store/contact/contact.service';
import { Observable, Subject, takeUntil, switchMap, fromEvent, filter } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import { Select, Store } from '@ngxs/store';

@Component({
  selector: 'app-contact-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation  : ViewEncapsulation.None,
})
export class ListComponent implements OnInit, OnDestroy{
  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    @Select(ContactState.selectStateData) contacts$: Observable<ContactModel[]>;

    contactsCount: number = 0;
    contactsTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    countries: [];//Country
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedContact: ContactModel;
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
        private _fuseMediaWatcherService: FuseMediaWatcherService
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
        // Get the contacts
        this._store.dispatch(new ContactAction.FetchAllContact())
        // this.contacts$ = this._contactsService.contacts$;
        this.contacts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((contacts: ContactModel[]) => {

                // Update the counts
                this.contactsCount = contacts.length;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Get the contact
        // this._contactsService.contact$
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe((contact: ContactModel) => {

        //         // Update the selected contact
        //         this.selectedContact = contact;

        //         // Mark for check
        //         this._changeDetectorRef.markForCheck();
        //     });

        // Get the countries
        // this._contactsService.countries$
        //     .pipe(takeUntil(this._unsubscribeAll))
        //     .subscribe((countries: Country[]) => {

        //         // Update the countries
        //         this.countries = countries;

        //         // Mark for check
        //         this._changeDetectorRef.markForCheck();
        //     });

        // Subscribe to search input field value changes
        // this.searchInputControl.valueChanges
        //     .pipe(
        //         takeUntil(this._unsubscribeAll),
        //         switchMap(query =>

        //             // Search
        //             // this._contactsService.searchContacts(query)
        //         )
        //     )
        //     .subscribe();

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
        this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((state) => {

                // Calculate the drawer mode
                this.drawerMode = state.matches ? 'side' : 'over';

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
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

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
