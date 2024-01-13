import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored, Select } from '@ngxs/store';
import { MessageTemplateModel, CountryModel, CountryService, MessageTemplateAction, MessageTemplateStateModel, MessageTemplateState } from 'app/shared/store';
import { FormUtils } from 'app/shared/utils/form-utils';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ListComponent } from '../list/list.component';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation  : ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailComponent {
  submitted = false
  editMode: boolean = false;

  messageTemplateModel: MessageTemplateModel=null;
  
  messageTemplateModelForm: UntypedFormGroup;
  private _tagsPanelOverlayRef: OverlayRef;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
   @Select(MessageTemplateState.selectStateLoading) isLoading:Observable<boolean>
  
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
      private _messageTemplateModelsListComponent: ListComponent,
      private _countryService:CountryService,
      private _formBuilder: UntypedFormBuilder,
      private _fuseConfirmationService: FuseConfirmationService,
      private _renderer2: Renderer2,
      private _router: Router,
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

      this._store.select(MessageTemplateState.selectStateByMessageTemplateId(this._activatedRoute.snapshot.paramMap.get('id')))
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((value)=>{
        // this.isLoading = false;
        if(!value) return;
        this.updateSelectedMessageTemplateModel(value);        
        
      });
      
    this._ngxsAction.pipe
    (
        takeUntil(this._unsubscribeAll),
        ofActionSuccessful(MessageTemplateAction.UpdateMessageTemplate)
    )
    .subscribe(
      (value:any)=>{
        this.toggleEditMode(false)
      }
    );

    this._ngxsAction.pipe
    (
        takeUntil(this._unsubscribeAll),
        ofActionCompleted(MessageTemplateAction.UpdateMessageTemplate)
    )
    .subscribe(
      (value) => {
        this.submitted=false
        // Mark for check
        this._changeDetectorRef.markForCheck();
      }
    )

    this._ngxsAction.pipe
    (
        takeUntil(this._unsubscribeAll),
        ofActionSuccessful(MessageTemplateAction.DeleteMessageTemplate)
    )
    .subscribe(
        (value) => {
            // this.isLoading =false
          // Navigate to the parent
          this._router.navigate(['../'], {relativeTo: this._activatedRoute});

          // Mark for check
          this._changeDetectorRef.markForCheck();
        }
      )

      this._ngxsAction.pipe
      (
        takeUntil(this._unsubscribeAll),
        ofActionErrored(MessageTemplateAction.DeleteMessageTemplate)
      ).subscribe(
        (value) => {
            // this.isLoading =false
          // Mark for check
          this._changeDetectorRef.markForCheck();
        }
      )

    // Toggle the edit mode off
    this.toggleEditMode(false);
    
    // Mark for check
    this._changeDetectorRef.markForCheck();
  }

  updateSelectedMessageTemplateModel(messageTemplateModel:MessageTemplateModel){
    // Open the drawer in case it is closed
    this._messageTemplateModelsListComponent.matDrawer.open();
    this.messageTemplateModel = messageTemplateModel;

    // Clear the emails and phoneNumbers form arrays
    this.messageTemplateModelForm.patchValue(messageTemplateModel);

    // Toggle the edit mode off
    this.toggleEditMode(false);

    // Mark for check
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

      // Dispose the overlays if they are still on the DOM
      if ( this._tagsPanelOverlayRef )
      {
          // this._tagsPanelOverlayRef.dispose();
      }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Close the drawer
   */
  closeDrawer(): Promise<MatDrawerToggleResult>
  {
      return this._messageTemplateModelsListComponent.matDrawer.close();
  }

  close()
    {
        // Navigate to the parent
        this._router.navigate(['../'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
  
   /**
     * Toggle edit mode
     *
     * @param editMode
     */
   toggleEditMode(editMode: boolean | null = null): void
   {
       if ( editMode === null )
       {
           this.editMode = !this.editMode;
       }
       else
       {
           this.editMode = editMode;
       }

       // Mark for check
       this._changeDetectorRef.markForCheck();
   }

   /**
   * update the messageTemplateModel
   */
   updateMessageTemplateModel(): void
  {
      // Get the messageTemplateModel object
      
      const messageTemplateModel = FormUtils.removeNullAttribut(this.messageTemplateModelForm.getRawValue());

      this.submitted=true;
      console.log("update ",messageTemplateModel,this.messageTemplateModel._id)
      this._store.dispatch(new MessageTemplateAction.UpdateMessageTemplate(messageTemplateModel,this.messageTemplateModel._id));
      // Mark for check
      this._changeDetectorRef.markForCheck();
  
  }

  /**
   * Delete the messageTemplateModel
   */
  deleteMessageTemplateModel(): void
  {
      // Open the confirmation dialog
      const confirmation = this._fuseConfirmationService.open({
          title  : 'Annuler la modification',
          message: 'Voulez-vous vraiment supprimer ce template? <br>Cette action est irréversible!',
          actions: {
              confirm: {
                  label: 'Supprimer'
              },
              'cancel':{
                label: 'Annuler'
              }
          }
      });

      // Subscribe to the confirmation dialog closed action
      confirmation.afterClosed().subscribe((result) => {

          // If the confirm button pressed...
          if ( result === 'confirmed' )
          {
            // this.isLoading=true;
            // Mark for check
            this._changeDetectorRef.markForCheck();         
            this._store.dispatch(new MessageTemplateAction.DeleteMessageTemplate(this.messageTemplateModel._id)); 
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
