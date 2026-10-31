import { ChangeDetectorRef, Component, Inject } from '@angular/core';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { TemplateSelection } from 'app/shared/components/cloud-template-picker/cloud-template-picker.component';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Select, Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { ContactModel, GlobalState, MessageAction, MessageModel, MessageState, MessageTemplateModel, MessageType } from 'app/shared/store';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Subject, Observable, combineLatest, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { NewMessageComponent } from '../../new-message/new-message.component';

@Component({
  selector: 'app-new-message-for-single-contact',
  templateUrl: './new-message-for-single-contact.component.html',
  styleUrls: ['./new-message-for-single-contact.component.scss']
})
export class NewMessageForSingleContactComponent {
  newMessageForm : UntypedFormGroup;
  messageSendToNow:boolean=false;
  destinationContact:ContactModel=null
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  messageToSend:{messageTemplate?:MessageTemplateModel,message?:string,file?:File | null,title?:string}={}
  submitted:boolean=false;
  @Select(MessageState.selectStateLoading) isSendingMessage:Observable<boolean>;
  @Select(UserProfileState.selectStateData) userProfile$:Observable<UserProfileModel>;
  @Select(GlobalState.selectStateConnectedWhatsApp) whatsappConnected$:Observable<boolean>;
  @Select(GlobalState.isWhatsAppReady) isWhatsAppReady$:Observable<boolean>;
  isWhatsAppSynced:boolean=false;
  isWhatsAppReady:boolean=false;
  /** Membre d'une organisation : envoi par le numero WhatsApp Business. */
  membership: Membership | null = null;
  cloudSelection: TemplateSelection | null = null;

  constructor(
    public matDialogRef: MatDialogRef<NewMessageForSingleContactComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
    private _ngxsAction:Actions,
    private _store:Store,
    private _toastrService: ToastrService,
    private _organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) data: {contact: ContactModel}
)
{
  this.destinationContact = data.contact;
}

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
      combineLatest([this.userProfile$, this.whatsappConnected$])
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(([profile, connected]) => {
          this.isWhatsAppSynced = !!profile?.hasSyncWhatsApp || !!connected;
        });

      this.isWhatsAppReady$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((ready) => {
          this.isWhatsAppReady = !!ready;
          this._changeDetectorRef.markForCheck();
        });

      this._organizationService.loadedMembership$.pipe(takeUntil(this._unsubscribeAll)).subscribe((membership) => {
        this.membership = membership;
        this._changeDetectorRef.markForCheck();
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


    setMessage(message:{messageTemplate?:MessageTemplateModel,message?:string,file?:File | null,title:string})
    {
      this.messageToSend=message;
    }

    get isCloud(): boolean
    {
      return !!this.membership;
    }

    get cloudReady(): boolean
    {
      const org = this.membership?.organization;
      return !!org && org.status === 'active'
        && org.subscription?.status !== 'pending_payment'
        && org.subscription?.status !== 'suspended'
        && org.whatsapp?.status === 'connected';
    }

    get channelReady(): boolean
    {
      return this.isCloud ? this.cloudReady : this.isWhatsAppReady;
    }

    get usesCloudTemplate(): boolean
    {
      return this.isCloud && !!this.cloudSelection?.template;
    }

    setCloudTemplate(selection: TemplateSelection)
    {
      this.cloudSelection = selection;
      this._changeDetectorRef.markForCheck();
    }

    sendMessage()
    {
      if (this.isCloud && !this.cloudReady) {
        this._toastrService.error("L'organisation ne peut pas envoyer : vérifiez l'abonnement et le numéro WhatsApp Business", 'Envoi impossible');
        return;
      }
      if (this.isCloud && this.cloudSelection?.template && !this.cloudSelection.complete) {
        this._toastrService.error('Renseignez toutes les variables du modèle', 'Validation');
        return;
      }
      if (!this.isCloud && !this.isWhatsAppReady) {
        this._toastrService.error(
          this.isWhatsAppSynced
            ? "La synchronisation WhatsApp est en cours. Veuillez patienter avant d'envoyer un message."
            : "Synchronisez votre compte WhatsApp avant d'envoyer un message",
          'WhatsApp indisponible'
        );
        return;
      }
      const title = (this.messageToSend.title || '').trim();
      if (!title) {
        this._toastrService.error('Le titre du message est requis', 'Validation');
        return;
      }
      if (!this.usesCloudTemplate && !this.hasMessageContent()) {
        this._toastrService.error('Ajoutez un texte, un template ou un fichier au message', 'Validation');
        return;
      }
      if (!this.destinationContact?._id) {
        this._toastrService.error('Destinataire introuvable', 'Validation');
        return;
      }

      this.submitted=true;
      let dataToSend:MessageModel={
        type:MessageType.TEXT,
        isSentToNow:true,
        contactsID:[this.destinationContact._id],
        title
        // groupsID:this.destinationGroups.map((group)=>group)
      }
      if (this.usesCloudTemplate) dataToSend.template = this.cloudSelection.template;
      else if(this.messageToSend.messageTemplate) dataToSend.messageTemplateId=this.messageToSend.messageTemplate._id
      else dataToSend.bodyText=this.messageToSend.message;
      if(this.messageToSend.file) dataToSend.bodyFile = this.messageToSend.file;
      // console.log("MessageToSend",dataToSend)
      this._store.dispatch(new MessageAction.SendMessage(dataToSend));
    }

    private hasMessageContent(): boolean
    {
      return !!(this.messageToSend.messageTemplate || (this.messageToSend.message && this.messageToSend.message.trim()) || this.messageToSend.file);
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
