import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { ContactModel, MessageTemplateModel, MessageAction } from 'app/shared/store';
import { Subject, takeUntil } from 'rxjs';
import { NewMessageComponent } from '../../new-message/new-message.component';

@Component({
  selector: 'app-previsualisation-message-contact',
  templateUrl: './previsualisation-message-contact.component.html',
  styleUrls: ['./previsualisation-message-contact.component.scss']
})
export class PrevisualisationMessageContactComponent {
  destinationContacts:ContactModel[]=[]
  filteredContacts:ContactModel[] = []
  selectedContact:ContactModel = null;


  private _unsubscribeAll: Subject<any> = new Subject<any>();
  messageToSend:{messageTemplate?:MessageTemplateModel,message?:string,file?:File}={}
  submitted:boolean=false;
  message:string="";
  dateToSend:Date = new Date()

  constructor(
    public matDialogRef: MatDialogRef<PrevisualisationMessageContactComponent>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _store:Store,
    @Inject(MAT_DIALOG_DATA) data: {destinationContact: ContactModel[],message:{messageTemplate?:MessageTemplateModel,message?:string,file?:File}}
  )
  {
    this.destinationContacts = [...data.destinationContact];
    this.filteredContacts = [...data.destinationContact]
    this.messageToSend = data.message;
    this.message = data.message.message?data.message.message:data.message.messageTemplate.content;
    console.log(data.message)
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void
  {
    // Mark for check
    this._changeDetectorRef.markForCheck();      
  }


  filterContacts(inputText:string)
  {
    if(inputText.length>1)
    {
      this.filteredContacts = this.destinationContacts.filter((contact)=>`${contact.fullName} ${contact.jobTitle} ${contact.company}`.toLowerCase().includes(inputText.toLowerCase()))
    }
    else this.filteredContacts = [...this.destinationContacts];
  }


    selectContact(contact)
    {
      this.selectedContact=contact;
    }

  saveAndClose(): void
  {
    // Close the dialog
    this.matDialogRef.close();
    // Mark for check
    this._changeDetectorRef.markForCheck();
  }

  getCustomMessage()
  {
    return this.message;
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
