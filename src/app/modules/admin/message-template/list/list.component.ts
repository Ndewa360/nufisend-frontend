import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { MessageTemplateAction, MessageTemplateModel, MessageTemplateState } from 'app/shared/store';
import { MessageTemplateService } from 'app/shared/store/';
import { Observable, Subject, takeUntil, switchMap, fromEvent, filter, tap } from 'rxjs';
import { MatDrawer } from '@angular/material/sidenav';
import { Select, Store } from '@ngxs/store';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-messageTemplate-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation  : ViewEncapsulation.None,
})
export class ListComponent implements OnInit, OnDestroy{
  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;

    @Select(MessageTemplateState.selectStateData) messageTemplates$: Observable<MessageTemplateModel[]>;
    @Select(MessageTemplateState.selectStateLoading) loading$:Observable<boolean>


    messageTemplatesCount: number = 0;
    messageTemplatesFiltered:MessageTemplateModel[]=[]
    messageTemplates:MessageTemplateModel[]=[]
    messageTemplatesTableColumns: string[] = ['name', 'email', 'phoneNumber', 'job'];
    drawerMode: 'side' | 'over';
    searchInputControl: UntypedFormControl = new UntypedFormControl();
    selectedMessageTemplate: MessageTemplateModel;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _messageTemplatesService: MessageTemplateService,
        @Inject(DOCUMENT) private _document: any,
        private _store: Store,
        private _router: Router,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _toastrService:ToastrService
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
        // Get the messageTemplates
        this._store.dispatch(new MessageTemplateAction.FetchAllMessageTemplate())


        this.messageTemplates$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((conts: MessageTemplateModel[]) => {
                
                if(!conts) return;
                // Update the counts
                this.messageTemplatesCount = conts.length;
                this.messageTemplates=[...conts]
                this._filterMessageTemplates(this.searchInputControl.value);
                this._changeDetectorRef.markForCheck()
                // Mark for check
                
            });

        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((query: string) => this._filterMessageTemplates(query));

        // Subscribe to MatDrawer opened change
        this.matDrawer.openedChange.subscribe((opened) => {
            if ( !opened )
            {
                // Remove the selected messageTemplate when drawer closed
                this.selectedMessageTemplate = null;

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

       
    
        // Subscribe to media query change
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
                this.createMessageTemplate();
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

    selectMessageTemplate(messageTemplate)
    {
        this.selectedMessageTemplate= messageTemplate
        // Go back to the list
        this._router.navigate(['./',messageTemplate._id], {relativeTo: this._activatedRoute});
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    /**
     * Create messageTemplate
     */
    createMessageTemplate(): void
    {
        // Create the messageTemplate

            // Go to the new messageTemplate
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

    /**
     * Dropped event
     *
     * @param event
     */
    dropped(event: CdkDragDrop<MessageTemplateModel[]>): void
    {
        // Move the item in the array
        moveItemInArray(this.messageTemplatesFiltered, event.previousIndex, event.currentIndex);

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _filterMessageTemplates(query: string): void
    {
        const normalizedQuery = this._normalize(query);

        if ( !normalizedQuery )
        {
            this.messageTemplatesFiltered = [...this.messageTemplates];
        }
        else
        {
            this.messageTemplatesFiltered = this.messageTemplates.filter((messageTemplate) => {
                return this._normalize([
                    messageTemplate.title,
                    messageTemplate.description,
                    this._plainText(messageTemplate.content)
                ].filter(Boolean).join(' ')).includes(normalizedQuery);
            });
        }

        this._changeDetectorRef.markForCheck();
    }

    private _normalize(value: string | undefined | null): string
    {
        return String(value ?? '')
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .trim();
    }

    private _plainText(value: string | undefined | null): string
    {
        return String(value ?? '')
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
