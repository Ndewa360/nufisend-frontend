import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { Actions, Store, ofActionCompleted } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { saveAs } from 'file-saver';
import { ContactAction, ContactState } from 'app/shared/store';
import { ContactImportPreview } from '../previsualize-data-file/previsualize-data-file.component';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.scss']
})
export class UploadFileComponent implements OnInit{

  
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  submitted:Observable<boolean>;
  importContactForm : UntypedFormGroup;
  file:File=null;
  preview:ContactImportPreview={total:0,ready:0,ignored:0,hasReadyRows:false};


  constructor(
    public matDialogRef: MatDialogRef<UploadFileComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
    private _ngxsAction:Actions,
    private _store:Store,
    private _matDialog: MatDialog, 

)
{
    this.submitted = this._store.select(ContactState.selectStateLoading);
}

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

      this._ngxsAction.pipe(
        ofActionCompleted(ContactAction.ImportContact),
        takeUntil(this._unsubscribeAll)
      ).subscribe(({result}) => {
        if (!result.successful) return;
        this.matDialogRef.close();
      });
    }

  saveAndClose(): void
  {
      // Close the dialog
    this.matDialogRef.close();
  }

  importFile()
  {
    if (!this.file || !this.preview.hasReadyRows) return;
    this._store.dispatch(new ContactAction.ImportContact(this.file));
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
    const header = ["fullName","phoneNumber","email","country","profilePicture","address","jobTitle","organization","company"];
    const example = ["Jean Dupont","+237690000000","jean.dupont@example.com","Cameroun","","Douala","Commercial","NufiSend","NufiSend"];
    const csvFile = [header.join(","), example.join(",")].join("\n");
    const blob = new Blob(["\uFEFF" + csvFile], {type: 'text/csv;charset=utf-8'});
    saveAs(blob, "modele-import-contacts.csv");
  }

  setFiles(files:File[])
  {
    this.file = files && files.length > 0 ? files[0] : null;
    if (!this.file) {
      this.preview = {total:0,ready:0,ignored:0,hasReadyRows:false};
    }
    this._changeDetectorRef.markForCheck();
  }

  setPreview(preview:ContactImportPreview)
  {
    this.preview = preview;
    this._changeDetectorRef.markForCheck();
  }
}

