import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { ContactModel, MessageAction, MessageModel, MessageState, MessageTemplateModel, MessageType } from 'app/shared/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { PrevisualisationMessageContactComponent } from '../components/previsualisation-message-contact/previsualisation-message-contact.component';

@Component({
  selector: 'app-new-message',
  templateUrl: './new-message.component.html',
  styleUrls: ['./new-message.component.scss'],
  encapsulation:ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewMessageComponent implements OnInit{

  
  newMessageForm : UntypedFormGroup;
  messageSendToNow:boolean=false;
  destinationContacts:ContactModel[] = []
  destinationGroups=[];
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  messageToSend:{messageTemplate?:MessageTemplateModel,message?:string,file?:File,title?:string}={}
  planificationObj={hasPlanification:false,planif:{}};
  submitted:boolean=false;
  @Select(MessageState.selectStateLoading) isSendingMessage:Observable<boolean>;

  constructor(
    public matDialogRef: MatDialogRef<NewMessageComponent>,
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
      this.newMessageForm = this._formBuilder.group({
        stepSelectContacts: this._formBuilder.group({}),
        stepSelectTypeMessage: this._formBuilder.group({}),
      });
      // Mark for check
      this._changeDetectorRef.markForCheck();

    this._ngxsAction.pipe
    (
        takeUntil(this._unsubscribeAll),
        ofActionSuccessful(MessageAction.SendMessage)
    )
    .subscribe(
      (value:any)=>{
        console.log("Save New Message");
        this.saveAndClose()
      }
    );

      
    }

  saveAndClose(): void
    {
      this.submitted=false;
        // Close the dialog
        this.matDialogRef.close();
        // Mark for check
        this._changeDetectorRef.markForCheck();
    }
    getDestinationMessageData(data)
    {
      this.destinationContacts=[...data.contacts];
      this.destinationGroups=[...data.groups]
      // Mark for check
      this._changeDetectorRef.markForCheck();
    }
    setMessageType(isSentToNow)
    {
      console.log("Set message type ",isSentToNow)
      this.messageSendToNow=isSentToNow;
      this._changeDetectorRef.markForCheck();
    }

    setMessage(message:{messageTemplate?:MessageTemplateModel,message?:string,file:File,title:string})
    {
      console.log("Message ",message)
      this.messageToSend=message;
    }

    sendMessage()
    {
      this.submitted=true;
      let dataToSend:MessageModel={
        type:MessageType.TEXT,
        isSentToNow:this.messageSendToNow,
        contactsID:this.destinationContacts.map((contact)=>contact._id),
        title:this.messageToSend.title
        // groupsID:this.destinationGroups.map((group)=>group)
      }

      if(!this.messageSendToNow && this.planificationObj.hasPlanification) dataToSend.planification=this.planificationObj.planif;
      if(this.messageToSend.messageTemplate) dataToSend.messageTemplateId=this.messageToSend.messageTemplate._id
      else dataToSend.bodyText=this.messageToSend.message;
      if(this.messageToSend.file) dataToSend.bodyFile = this.messageToSend.file;
      console.log("DataToSend ",dataToSend)
      this._store.dispatch(new MessageAction.SendMessage(dataToSend));
    }

    canPrevisualise()
    {
      return (this.messageToSend.messageTemplate || this.messageToSend.message) && this.destinationContacts.length>0
    }

    setPlanification(planif)
    {
      this.planificationObj = planif;
      console.log("Set Planification ",planif)
    }

    privisualiserMessage()
    {
      // Open the dialog
      const dialogRef = this._matDialog.open(PrevisualisationMessageContactComponent,
        {
          minHeight: '80%',
          minWidth: '80%',
          data: {
            destinationContact: this.destinationContacts,
            message: this.messageToSend
          }
        }
      );
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
