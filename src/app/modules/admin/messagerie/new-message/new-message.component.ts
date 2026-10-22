import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { ContactModel, ContactState, GroupModel, MessageAction, MessageModel, MessagePlanification, MessageState, MessageTemplateModel, MessageType } from 'app/shared/store';
import { Observable, Subject, firstValueFrom, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
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
  destinationGroups:GroupModel[]=[];
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  messageToSend:{messageTemplate?:MessageTemplateModel,message?:string,file?:File | null,title?:string}={}
  planificationObj:{hasPlanification:boolean, planif:MessagePlanification[]}={hasPlanification:false,planif:[]};
  submitted:boolean=false;
  @Select(MessageState.selectStateLoading) isSendingMessage:Observable<boolean>;

  constructor(
    public matDialogRef: MatDialogRef<NewMessageComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
    private _ngxsAction:Actions,
    private _store:Store,
    private _matDialog: MatDialog,
    private _toastrService: ToastrService

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
      this.messageSendToNow=isSentToNow;
      this._changeDetectorRef.markForCheck();
    }

    setMessage(message:{messageTemplate?:MessageTemplateModel,message?:string,file?:File | null,title:string})
    {
      this.messageToSend=message;
    }

    sendMessage()
    {
      const title = (this.messageToSend.title || '').trim();
      if (!title) {
        this._toastrService.error('Le titre du message est requis', 'Validation');
        return;
      }
      if (!this.hasMessageContent()) {
        this._toastrService.error('Ajoutez un texte, un template ou un fichier au message', 'Validation');
        return;
      }
      if (this.destinationContacts.length === 0 && this.destinationGroups.length === 0) {
        this._toastrService.error('Selectionnez au moins un destinataire', 'Validation');
        return;
      }
      if (!this.messageSendToNow && !this.planificationObj.hasPlanification) {
        this._toastrService.error('Definissez la planification du message', 'Validation');
        return;
      }

      this.submitted=true;
      let dataToSend:MessageModel={
        type:MessageType.TEXT,
        isSentToNow:this.messageSendToNow,
        contactsID:this.destinationContacts.map((contact)=>contact._id),
        title,
        groupsID:this.destinationGroups.map((group)=>group._id)
      }

      if(!this.messageSendToNow && this.planificationObj.hasPlanification) dataToSend.planification=this.planificationObj.planif;
      if(this.messageToSend.messageTemplate) dataToSend.messageTemplateId=this.messageToSend.messageTemplate._id
      else dataToSend.bodyText=this.messageToSend.message;
      if(this.messageToSend.file) dataToSend.bodyFile = this.messageToSend.file;
      this._store.dispatch(new MessageAction.SendMessage(dataToSend));
    }

    canPrevisualise(): boolean
    {
      return this.hasMessageContent() && (this.destinationContacts.length > 0 || this.destinationGroups.length > 0);
    }

    private hasMessageContent(): boolean
    {
      return !!(this.messageToSend.messageTemplate || (this.messageToSend.message && this.messageToSend.message.trim()) || this.messageToSend.file);
    }

    setPlanification(planif)
    {
      this.planificationObj = planif;
    }

    async privisualiserMessage()
    {
      let contactGroup = [];
      if(this.destinationGroups.length>0)
      {
        contactGroup = (await Promise.all(this.destinationGroups.map(async (group)=>{
          let contacts= await firstValueFrom(this._store.select(ContactState.selectStateByContactsId(group.contacts)))
          return contacts.map((contact)=>({...contact,groupName:group.name}))
        })))
        .reduce((allContacts,contacts)=>[...allContacts,...contacts],[])
      }
      
      

      // Open the dialog
      const dialogRef = this._matDialog.open(PrevisualisationMessageContactComponent,
        {
          minHeight: '80%',
          minWidth: '80%',
          data: {
            destinationContact: [...this.destinationContacts,...contactGroup],
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
