import { ChangeDetectorRef, Component, Renderer2, ViewContainerRef } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store, Actions, ofActionCompleted, ofActionErrored, ofActionSuccessful } from '@ngxs/store';
import { Overlay } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';
import { ListComponent } from '../list/list.component';
import { ContactModel, GroupAction, GroupModel, GroupState } from 'app/shared/store';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { FormUtils } from 'app/shared/utils';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent {
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  selectedContact:ContactModel[]=[];
  submitted = false
  editMode: boolean = false;

  groupModel: GroupModel=null;
  
  groupForm: UntypedFormGroup;
  isLoading=true;

  /**
   * Constructor
   */
  constructor(
    private _activatedRoute: ActivatedRoute,
    private _changeDetectorRef: ChangeDetectorRef,
    private _groupsListComponent: ListComponent,
    private _formBuilder: UntypedFormBuilder,
    private _fuseConfirmationService: FuseConfirmationService,
    private _renderer2: Renderer2,
    private _router: Router,
    private _overlay: Overlay,
    private _store:Store,
    private _ngxsAction:Actions
)
{}

// -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void
  {
      // Open the drawer
      this._groupsListComponent.matDrawer.open();

       // Create the group form
       this.groupForm = this._formBuilder.group({
        name       : ['',[Validators.required]],
        description         : [''],
    });

    this._store.select(GroupState.selectStateByGroupId(this._activatedRoute.snapshot.paramMap.get('id')))
    .pipe(takeUntil(this._unsubscribeAll))
    .subscribe((value)=>{
      this.isLoading = false;
      if(!value) return;
      this.updateSelectedGroup(value);        
    });
    
  this._ngxsAction.pipe
  (
      takeUntil(this._unsubscribeAll),
      ofActionSuccessful(GroupAction.UpdateGroup)
  )
  .subscribe(
    (value:any)=>{
      this.toggleEditMode(false)
      this.updateSelectedGroup(value.group)
    }
  );

  this._ngxsAction.pipe
  (
      takeUntil(this._unsubscribeAll),
      ofActionCompleted(GroupAction.UpdateGroup)
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
      ofActionSuccessful(GroupAction.DeleteGroup)
  )
  .subscribe(
      (value) => {
          this.isLoading =false
        // Navigate to the parent
        this._router.navigate(['../'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
      }
    )

    this._ngxsAction.pipe
    (
      takeUntil(this._unsubscribeAll),
      ofActionErrored(GroupAction.DeleteGroup)
    ).subscribe(
      (value) => {
          this.isLoading =false
        // Mark for check
        this._changeDetectorRef.markForCheck();
      }
    )

  // Toggle the edit mode off
  this.toggleEditMode(false);
  
  // Mark for check
  this._changeDetectorRef.markForCheck();
  }

  updateSelectedGroup(group:GroupModel){
    // Open the drawer in case it is closed
    this._groupsListComponent.matDrawer.open();
    this.groupModel = group;

   this.groupForm.patchValue(group);

    // Toggle the edit mode off
    this.toggleEditMode(false);

    // Mark for check
    this._changeDetectorRef.markForCheck();
  }

  selectedContactEvent(contactsList)
  {
    this.selectedContact=[...contactsList]
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
   * Close the drawer
   */
  closeDrawer(): Promise<MatDrawerToggleResult>
  {
      return this._groupsListComponent.matDrawer.close();
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
   * update the group
   */
   updateGroup(): void
  {
      // Get the group object
      
      const group = FormUtils.removeNullAttribut(this.groupForm.getRawValue());
      if(this.selectedContact.length>0) group.contacts= this.selectedContact.map((contact)=>contact._id)

      this.submitted=true;
      this._store.dispatch(new GroupAction.UpdateGroup(group,this.groupModel._id));
  }

  /**
   * Delete the group
   */
  deleteGroup(): void
  {
      // Open the confirmation dialog
      const confirmation = this._fuseConfirmationService.open({
          title  : 'Annuler la modification',
          message: 'Voulez-vous vraiment supprimer ce groupe? Cette action est irréversible!',
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
            this.isLoading=true;
            // Mark for check
            this._changeDetectorRef.markForCheck();         
            this._store.dispatch(new GroupAction.DeleteGroup(this.groupModel._id)); 
          }
      });

  }

}
