import { TemplatePortal } from '@angular/cdk/portal';
import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MessageTemplateAction, MessageTemplateModel } from 'app/shared/store';
import { assign } from 'lodash';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { Subject, tap, debounceTime, takeUntil, filter } from 'rxjs';
import { ListComponent } from '../list/list.component';
import { FormUtils } from 'app/shared/utils/form-utils';
import { Actions, Store, ofActionCompleted, ofActionSuccessful } from '@ngxs/store';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
  encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddComponent implements OnInit, AfterViewInit, OnDestroy{
    @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;
    @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
    @ViewChild('titleField') private _titleField: ElementRef;
    submitted = false;

    tagsEditMode: boolean = false;
    messageTemplateModel: MessageTemplateModel;
    messageTemplateModelForm: UntypedFormGroup;
    messageTemplateModels: MessageTemplateModel[];
    private _tagsPanelOverlayRef: OverlayRef;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    quillModules: any = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],        // toggled buttons

            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript

            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

            [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
            [{ 'align': [] }],

            ['clean'],                                         // remove formatting button

            ['link', 'image']           ,
            // [{'insert':["{{email}}","{{numPhone}}"]}],

                 [ { "custom": ["ced1","ced2"],value:"Ced" }]
                
        ],
    };

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfirmationService: FuseConfirmationService,
        private _renderer2: Renderer2,
        private _router: Router,
        private _messageTemplateModelsListComponent: ListComponent,
        private _overlay: Overlay,
        private _viewContainerRef: ViewContainerRef,
        private _store:Store,
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
        // Open the drawer
        this._messageTemplateModelsListComponent.matDrawer.open();

        // Create the messageTemplateModel form
        this.messageTemplateModelForm = this._formBuilder.group({
            title    : ['',[Validators.required]],
            description    : [''],
            content : ['',[Validators.required]]
        });


        // Update messageTemplateModel when there is a value change on the messageTemplateModel form
        this.messageTemplateModelForm.valueChanges
            .pipe(
                tap((value) => {

                    // Update the messageTemplateModel object
                    this.messageTemplateModel = assign(this.messageTemplateModel, value);
                }),
                debounceTime(300),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((value) => {

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Listen for NavigationEnd event to focus on the title field
        this._router.events
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(event => event instanceof NavigationEnd)
            )
            .subscribe(() => {

                // Focus on the title field
                this._titleField.nativeElement.focus();
            });

            this._ngxsAction.pipe(ofActionSuccessful(MessageTemplateAction.AddMessageTemplate)).subscribe(
                (value) => {
                  this.submitted=false
                  this.close()
                }
              )
            
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {
        // Listen for matDrawer opened change
        this._messageTemplateModelsListComponent.matDrawer.openedChange
            .pipe(
                takeUntil(this._unsubscribeAll),
                filter(opened => opened)
            )
            .subscribe(() => {

                // Focus on the title element
                this._titleField.nativeElement.focus();
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

        // Dispose the overlay
        if ( this._tagsPanelOverlayRef )
        {
            // this._tagsPanelOverlayRef.dispose();
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    close()
    {
        // Navigate to the parent
        this._router.navigate(['../'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
    /**
     * Close the drawer
     */
    closeDrawer(): Promise<MatDrawerToggleResult>
    {
        return this._messageTemplateModelsListComponent.matDrawer.close();
    }

    /**
     * Toggle the completed status
     */
    toggleCompleted(): void
    {
        // Get the form control for 'completed'
        const completedFormControl = this.messageTemplateModelForm.get('completed');

        // Toggle the completed status
        completedFormControl.setValue(!completedFormControl.value);
    }

    

    addMessageTemplateModel()
    {
        if(this.messageTemplateModelForm.invalid) return;
        const messaggeTemplate = FormUtils.removeNullAttribut(this.messageTemplateModelForm.getRawValue());
        this.submitted = true;
        this._store.dispatch(new MessageTemplateAction.AddMessageTemplate(messaggeTemplate));
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
  
   
    /**
     * Set the messageTemplateModel priority
     *
     * @param priority
     */
    setMessageTemplateModelPriority(priority): void
    {
        // Set the value
        this.messageTemplateModelForm.get('priority').setValue(priority);
    }

    

    /**
     * Delete the messageTemplateModel
     */
    deleteMessageTemplateModel(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Delete messageTemplateModel',
            message: 'Are you sure you want to delete this messageTemplateModel? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {

                // Get the current messageTemplateModel's id
                const id = this.messageTemplateModel._id;

                 // Navigate to the parent
                 this._router.navigate(['../'], {relativeTo: this._activatedRoute});

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });
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
