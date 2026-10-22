import { ChangeDetectorRef, Component, Renderer2, ViewContainerRef } from '@angular/core';
import { ListComponent } from '../list/list.component';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store, Actions, ofActionCompleted, ofActionSuccessful } from '@ngxs/store';
import { Subject } from 'rxjs';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { FormUtils } from 'app/shared/utils/form-utils';
import { ContactModel, GroupAction } from 'app/shared/store';

@Component({
  selector: 'app-add',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss']
})
export class AddComponent {

  private _tagsPanelOverlayRef: OverlayRef;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  groupForm: UntypedFormGroup;
  selectedContact:ContactModel[]=[];

  submitted = false

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
        this._groupsListComponent.matDrawer.open();

            // Create the group form
            this.groupForm = this._formBuilder.group({
            name       : ['', [Validators.required]],          
            description       : [''],
        });

        this._ngxsAction.pipe(ofActionSuccessful(GroupAction.AddGroup)).subscribe(
            (value)=>{
            // Navigate to the parent
            this._router.navigate(['../'], {relativeTo: this._activatedRoute});
    
            // Mark for check
            this._changeDetectorRef.markForCheck();
            }
          );
          this._ngxsAction.pipe(ofActionCompleted(GroupAction.AddGroup)).subscribe(
            (value) => {
              this.submitted=false
              // Mark for check
              this._changeDetectorRef.markForCheck();
            }
          )

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
            this._tagsPanelOverlayRef.dispose();
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
        return this._groupsListComponent.matDrawer.close();
    }

    /**
     * Delete the groupe
     */
    deleteGroup(): void
    {
        // Open the confirmation dialog
        const confirmation = this._fuseConfirmationService.open({
            title  : 'Annuler la création',
            message: 'Voulez-vous annuler la création du groupe? Cette action est irréversible!',
            actions: {
                confirm: {
                    label: 'Annuler'
                },
                'cancel':{
                  label: 'Revenir'
                }
            }
        });

        // Subscribe to the confirmation dialog closed action
        confirmation.afterClosed().subscribe((result) => {

            // If the confirm button pressed...
            if ( result === 'confirmed' )
            {
                 // Navigate to the parent
                 this._router.navigate(['../'], {relativeTo: this._activatedRoute});

                // Mark for check
                this._changeDetectorRef.markForCheck();
            }
        });

    }

    selectedContactEvent(contactsList)
  {
    this.selectedContact=[...contactsList]
  }

    /**
     * add the group
     */
    addGroup(): void
    {
        // Get the group object
        
        const group = FormUtils.removeNullAttribut(this.groupForm.getRawValue());

        this.submitted=true;
        group.contacts = this.selectedContact.map((contact)=>contact._id)

        this._store.dispatch(new GroupAction.AddGroup(group));
                
        // Update the contact on the server
        // this._contactsService.updateGroup(contact.id, contact).subscribe(() => {

        //     // Toggle the edit mode off
        //     this.toggleEditMode(false);
        // });


    }
}
