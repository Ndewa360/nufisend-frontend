import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Actions, Store } from '@ngxs/store';
import { Subject } from 'rxjs';
import { saveAs } from 'file-saver';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent implements OnInit{

  
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  submitted:boolean=false;
  importContactForm : UntypedFormGroup;
  file:File=null;


  constructor(
    public matDialogRef: MatDialogRef<UploadFileComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
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

      this.importContactForm = this._formBuilder.group({
        stepSelectContacts: this._formBuilder.group({}),
        stepSelectTypeMessage: this._formBuilder.group({}),
      });
      
    }

  saveAndClose(): void
  {
    this.submitted=false;
      // Close the dialog
    this.matDialogRef.close();
  }

  importFile()
  {

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

  generateCSVFile()
  {
    const header = ["fullName","email_default","phoneNumber_default","profilePicture","address","jobTitle","company"]
    let csvFile = header.join(",")
    var blob = new Blob([csvFile], {type: 'text/csv' })
    saveAs(blob, "myFile.csv");
  }

  setFiles(files:File[])
  {
    if(files.length<0) return;
    this.file = files[0];
  }
}

