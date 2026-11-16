import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { ContactModel, ContactState, GlobalState, GroupModel, MessageAction, MessageModel, MessagePlanification, MessageState, MessageTemplateModel, MessageType } from 'app/shared/store';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Observable, Subject, combineLatest, firstValueFrom, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { buildSendPayload } from '../message-payload.builder';
import { PrevisualisationMessageContactComponent } from '../components/previsualisation-message-contact/previsualisation-message-contact.component';
import { Router } from '@angular/router';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { isChannelReady, isOrganizationCloudReady, resolveMessagingChannel } from 'app/core/organization/messaging-channel';
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
  messageToSend:{messageTemplate?:MessageTemplateModel,message?:string,files?:File[],error?:string}={}
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
  /** Adhesion : undefined = non chargee, null = compte personnel, objet = membre (envoi Cloud). */
  membership: Membership | null | undefined = undefined;
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

      this._organizationService.membership$.pipe(takeUntil(this._unsubscribeAll)).subscribe((membership) => {
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

    get isPersonal(): boolean
    {
      return this.membership === null;
    }

    get channelUnknown(): boolean
    {
      return resolveMessagingChannel(this.membership) === 'unknown';
    }

    /** L'organisation peut envoyer (numero WhatsApp Business raccorde). */
    get cloudReady(): boolean
    {
      return isOrganizationCloudReady(this.membership);
    }

    get usesCloudTemplate(): boolean
    {
      return this.isCloud && !!this.cloudSelection?.template;
    }

    /** Pret a envoyer (WhatsApp personnel synchronise, ou organisation operationnelle). */
    get channelReady(): boolean
    {
      return isChannelReady(this.membership, this.isWhatsAppReady);
    }

    get sendBlockedReason(): string
    {
      if (this.channelReady) return '';
      if (this.channelUnknown) return "Espace d'envoi en cours de chargement";
      if (this.isCloud) return "L'organisation ne peut pas envoyer pour le moment";
      return 'La synchronisation WhatsApp doit être terminée pour envoyer';
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

    setMessage(message:{messageTemplate?:MessageTemplateModel,message?:string,files?:File[],error?:string})
    {
      this.messageToSend=message;
      this.hasAttachment=!!message?.files?.length;
      this._changeDetectorRef.markForCheck();
    }

    setCostSufficient(sufficient:boolean)
    {
      this.costSufficient=sufficient;
      this._changeDetectorRef.markForCheck();
    }

    sendMessage()
    {
      if (this.channelUnknown) {
        this._toastrService.error("Espace d'envoi en cours de chargement. Rechargez la page.", 'Envoi impossible');
        return;
      }
      if (!this.isCloud) {
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
      } else if (!this.cloudReady) {
        this._toastrService.error("L'organisation ne peut pas envoyer : vérifiez le numéro WhatsApp Business et la ligne de crédit", 'Envoi impossible');
        return;
      }

      const result = buildSendPayload({
        channel: this.isCloud ? 'cloud' : 'personal',
        isSentToNow: this.messageSendToNow,
        target: {
          contactIds: this.destinationContacts.map((contact) => contact._id),
          groupIds: this.destinationGroups.map((group) => group._id),
        },
        composition: {
          message: this.messageToSend.message ?? null,
          files: this.messageToSend.files || [],
          messageTemplateId: this.messageToSend.messageTemplate?._id ?? null,
        },
        cloudTemplate: this.cloudSelection?.template ?? null,
        cloudTemplateComplete: !!this.cloudSelection?.complete,
        planification: this.planificationObj.hasPlanification ? this.planificationObj.planif : null,
        costSufficient: this.costSufficient,
        composeError: this.messageToSend.error ?? null,
      });

      if (result.ok === false) {
        const toast = result.error.level === 'warning' ? this._toastrService.warning : this._toastrService.error;
        toast.call(this._toastrService, result.error.message, result.error.title);
        return;
      }

      this.submitted = true;
      this._store.dispatch(new MessageAction.SendMessage(result.payload));
    }

    canPrevisualise(): boolean
    {
      if (this.usesCloudTemplate) return false;
      return this.channelReady && this.hasMessageContent() && (this.destinationContacts.length > 0 || this.destinationGroups.length > 0);
    }

    private hasMessageContent(): boolean
    {
      return !!(this.messageToSend.messageTemplate || (this.messageToSend.message && this.messageToSend.message.trim()) || this.messageToSend.files?.length);
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
