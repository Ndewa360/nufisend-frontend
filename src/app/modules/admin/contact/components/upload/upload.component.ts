import { Component } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Actions, Store } from '@ngxs/store';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-upload',
  templateUrl: './upload.component.html',
  styleUrls: ['./upload.component.scss']
})
export class UploadComponent {

  submitted:boolean=false;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  
  constructor(
    public matDialogRef: MatDialogRef<UploadComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _ngxsAction:Actions,
    private _store:Store,
    private _matDialog: MatDialog, 

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
    }

    saveAndClose(): void
    {
      this.submitted=false;
        // Close the dialog
        this.matDialogRef.close();
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
}
