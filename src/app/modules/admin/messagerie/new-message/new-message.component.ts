import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { ContactModel, ContactState, GlobalState, GroupModel, MessageAction, MessageModel, MessagePlanification, MessageState, MessageTemplateModel, MessageType } from 'app/shared/store';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Observable, Subject, combineLatest, firstValueFrom, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { PrevisualisationMessageContactComponent } from '../components/previsualisation-message-contact/previsualisation-message-contact.component';
import { Router } from '@angular/router';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { TemplateSelection } from 'app/shared/components/cloud-template-picker/cloud-template-picker.component';

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
  @Select(UserProfileState.selectStateData) userProfile$:Observable<UserProfileModel>;
  @Select(GlobalState.selectStateConnectedWhatsApp) whatsappConnected$:Observable<boolean>;
  @Select(GlobalState.isWhatsAppReady) isWhatsAppReady$: Observable<boolean>;
  isWhatsAppSynced:boolean=false;
  isWhatsAppReady:boolean=false;
  /** Destinataires uniques (contacts + membres des groupes) pour l'estimation du cout. */
  recipientsCount:number=0;
  hasAttachment:boolean=false;
  costSufficient:boolean=true;
  /** Membre d'une organisation : envoi par l'API WhatsApp Cloud (pas de synchro WhatsApp). */
  membership: Membership | null = null;
  cloudSelection: TemplateSelection | null = null;

  constructor(
    public matDialogRef: MatDialogRef<NewMessageComponent>,
    private _formBuilder: UntypedFormBuilder,
    private _changeDetectorRef: ChangeDetectorRef,
    private _ngxsAction:Actions,
    private _store:Store,
    private _matDialog: MatDialog,
    private _toastrService: ToastrService,
    private _router: Router,
    private _organizationService: OrganizationService

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
      combineLatest([this.userProfile$, this.whatsappConnected$])
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe(([profile, connected]) => {
          this.isWhatsAppSynced = !!profile?.hasSyncWhatsApp || !!connected;
          this._changeDetectorRef.markForCheck();
        });

      this.isWhatsAppReady$.pipe(takeUntil(this._unsubscribeAll)).subscribe((ready) => {
        this.isWhatsAppReady = !!ready;
        this.isWhatsAppSynced = this.isWhatsAppSynced || this.isWhatsAppReady;
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
    getDestinationMessageData(data)
    {
      this.destinationContacts=[...data.contacts];
      this.destinationGroups=[...data.groups]
      const recipientIds = new Set<string>(this.destinationContacts.map((contact)=>String(contact._id)));
      for (const group of this.destinationGroups)
        for (const contact of (group.contacts || []) as any[]) recipientIds.add(String(contact?._id ?? contact));
      this.recipientsCount = recipientIds.size;
      // Mark for check
      this._changeDetectorRef.markForCheck();
    }
    setMessageType(isSentToNow)
    {
      this.messageSendToNow=isSentToNow;
      this._changeDetectorRef.markForCheck();
    }

    get isCloud(): boolean
    {
      return !!this.membership;
    }

    /** L'organisation peut envoyer (abonnement regle, numero raccorde). */
    get cloudReady(): boolean
    {
      const org = this.membership?.organization;
      return !!org && org.status === 'active'
        && org.subscription?.status !== 'pending_payment'
        && org.subscription?.status !== 'suspended'
        && org.whatsapp?.status === 'connected';
    }

    get usesCloudTemplate(): boolean
    {
      return this.isCloud && !!this.cloudSelection?.template;
    }

    /** Pret a envoyer (WhatsApp personnel synchronise, ou organisation operationnelle). */
    get channelReady(): boolean
    {
      return this.isCloud ? this.cloudReady : this.isWhatsAppReady;
    }

    get costCategory(): string | null
    {
      return this.isCloud ? (this.cloudSelection?.category || 'service') : null;
    }

    setCloudTemplate(selection: TemplateSelection)
    {
      this.cloudSelection = selection;
      this._changeDetectorRef.markForCheck();
    }

    setMessage(message:{messageTemplate?:MessageTemplateModel,message?:string,file?:File | null,title:string})
    {
      this.messageToSend=message;
      this.hasAttachment=!!message?.file;
      this._changeDetectorRef.markForCheck();
    }

    setCostSufficient(sufficient:boolean)
    {
      this.costSufficient=sufficient;
      this._changeDetectorRef.markForCheck();
    }

    sendMessage()
    {
      if (this.isCloud) {
        this.sendCloudMessage();
        return;
      }
      if (!this.isWhatsAppReady && !this.isWhatsAppSynced) {
        this._toastrService.error("Synchronisez votre compte WhatsApp avant d'envoyer un message", 'WhatsApp non synchronisé');
        this._router.navigate(['/sync_whatsapp']);
        return;
      }
      if (!this.isWhatsAppReady) {
        this._toastrService.error("La synchronisation WhatsApp n'est pas terminée. Veuillez patienter ou synchroniser votre compte.", 'WhatsApp indisponible');
        this._router.navigate(['/sync_whatsapp']);
        return;
      }
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
      if (!this.costSufficient) {
        this._toastrService.warning('Rechargez votre portefeuille pour couvrir le coût de cet envoi', 'Solde insuffisant');
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

    /**
     * Envoi d'un membre d'organisation : numero WhatsApp Business, modele
     * approuve obligatoire pour un message programme.
     */
    private sendCloudMessage()
    {
      if (!this.cloudReady) {
        this._toastrService.error("L'organisation ne peut pas envoyer : vérifiez l'abonnement et le numéro WhatsApp Business", 'Envoi impossible');
        return;
      }
      const title = (this.messageToSend.title || '').trim();
      if (!title) {
        this._toastrService.error('Le titre du message est requis', 'Validation');
        return;
      }
      if (this.destinationContacts.length === 0 && this.destinationGroups.length === 0) {
        this._toastrService.error('Selectionnez au moins un destinataire', 'Validation');
        return;
      }
      const template = this.cloudSelection?.template || null;
      if (!this.messageSendToNow && !template) {
        this._toastrService.error('Un message programmé doit utiliser un modèle WhatsApp approuvé', 'Validation');
        return;
      }
      if (template && !this.cloudSelection.complete) {
        this._toastrService.error('Renseignez toutes les variables du modèle (et son média d\'en-tête)', 'Validation');
        return;
      }
      if (!template && !this.hasMessageContent()) {
        this._toastrService.error('Ajoutez un texte ou un fichier, ou choisissez un modèle', 'Validation');
        return;
      }
      if (!this.messageSendToNow && !this.planificationObj.hasPlanification) {
        this._toastrService.error('Definissez la planification du message', 'Validation');
        return;
      }
      if (!this.costSufficient) {
        this._toastrService.warning("Rechargez le portefeuille de l'organisation pour couvrir le coût de cet envoi", 'Solde insuffisant');
        return;
      }

      this.submitted=true;
      const dataToSend:MessageModel={
        type:MessageType.TEXT,
        isSentToNow:this.messageSendToNow,
        contactsID:this.destinationContacts.map((contact)=>contact._id),
        title,
        groupsID:this.destinationGroups.map((group)=>group._id)
      }
      if(!this.messageSendToNow) dataToSend.planification=this.planificationObj.planif;
      if (template) dataToSend.template = template;
      else if(this.messageToSend.messageTemplate) dataToSend.messageTemplateId=this.messageToSend.messageTemplate._id
      else dataToSend.bodyText=this.messageToSend.message;
      if(this.messageToSend.file) dataToSend.bodyFile = this.messageToSend.file;
      this._store.dispatch(new MessageAction.SendMessage(dataToSend));
    }

    canPrevisualise(): boolean
    {
      if (this.usesCloudTemplate) return false;
      return this.channelReady && this.hasMessageContent() && (this.destinationContacts.length > 0 || this.destinationGroups.length > 0);
    }

    private hasMessageContent(): boolean
    {
      return !!(this.messageToSend.messageTemplate || (this.messageToSend.message && this.messageToSend.message.trim()) || this.messageToSend.file);
    }

    setPlanification(planif)
    {
      this.planificationObj = planif;
      this._changeDetectorRef.markForCheck();
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
