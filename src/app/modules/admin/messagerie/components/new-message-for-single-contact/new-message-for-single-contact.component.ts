import { ChangeDetectorRef, Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { isChannelReady, isOrganizationCloudReady, resolveMessagingChannel } from 'app/core/organization/messaging-channel';
import { TemplateSelection } from 'app/shared/components/cloud-template-picker/cloud-template-picker.component';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Select, Actions, Store, ofActionSuccessful } from '@ngxs/store';
import { ContactModel, GlobalState, MessageAction, MessageState, MessageTemplateModel } from 'app/shared/store';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Subject, Observable, combineLatest, takeUntil } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { buildSendPayload } from '../../message-payload.builder';
import { ComposedMessage } from '../rediger-message-direct/rediger-message-direct.component';

/**
 * Message immediat a un contact unique (depuis la liste des contacts).
 * Meme regles d'envoi que la messagerie : voir message-payload.builder.ts.
 */
@Component({
  selector: 'app-new-message-for-single-contact',
  templateUrl: './new-message-for-single-contact.component.html',
  styleUrls: ['./new-message-for-single-contact.component.scss']
})
export class NewMessageForSingleContactComponent implements OnInit, OnDestroy {
  @Select(MessageState.selectStateLoading) isSendingMessage: Observable<boolean>;
  @Select(UserProfileState.selectStateData) userProfile$: Observable<UserProfileModel>;
  @Select(GlobalState.selectStateConnectedWhatsApp) whatsappConnected$: Observable<boolean>;
  @Select(GlobalState.isWhatsAppReady) isWhatsAppReady$: Observable<boolean>;

  destinationContact: ContactModel = null;
  messageToSend: Partial<ComposedMessage> & { messageTemplate?: MessageTemplateModel } = {};
  cloudSelection: TemplateSelection | null = null;

  isWhatsAppSynced = false;
  isWhatsAppReady = false;
  /** Adhesion : undefined = non chargee, null = compte personnel, objet = membre. */
  membership: Membership | null | undefined = undefined;

  private _unsubscribeAll = new Subject<void>();

  constructor(
    public matDialogRef: MatDialogRef<NewMessageForSingleContactComponent>,
    private _changeDetectorRef: ChangeDetectorRef,
    private _ngxsAction: Actions,
    private _store: Store,
    private _toastrService: ToastrService,
    private _organizationService: OrganizationService,
    @Inject(MAT_DIALOG_DATA) data: { contact: ContactModel }
  ) {
    this.destinationContact = data.contact;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Canal (source unique : messaging-channel.ts)
  // -----------------------------------------------------------------------------------------------------

  get isCloud(): boolean {
    return !!this.membership;
  }

  get isPersonal(): boolean {
    return this.membership === null;
  }

  get channelUnknown(): boolean {
    return resolveMessagingChannel(this.membership) === 'unknown';
  }

  get cloudReady(): boolean {
    return isOrganizationCloudReady(this.membership);
  }

  get channelReady(): boolean {
    return isChannelReady(this.membership, this.isWhatsAppReady);
  }

  get sendBlockedReason(): string {
    if (this.channelReady) return '';
    if (this.channelUnknown) return "Espace d'envoi en cours de chargement";
    if (this.isCloud) return "L'organisation ne peut pas envoyer pour le moment";
    return this.isWhatsAppSynced
      ? 'La synchronisation WhatsApp est en cours'
      : 'Synchronisez votre compte WhatsApp pour envoyer';
  }

  get usesCloudTemplate(): boolean {
    return this.isCloud && !!this.cloudSelection?.template;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle
  // -----------------------------------------------------------------------------------------------------

  ngOnInit(): void {
    combineLatest([this.userProfile$, this.whatsappConnected$])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([profile, connected]) => {
        this.isWhatsAppSynced = !!profile?.hasSyncWhatsApp || !!connected;
        this._changeDetectorRef.markForCheck();
      });

    this.isWhatsAppReady$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((ready) => {
        this.isWhatsAppReady = !!ready;
        this._changeDetectorRef.markForCheck();
      });

    this._organizationService.membership$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((membership) => {
        this.membership = membership;
        this._changeDetectorRef.markForCheck();
      });

    this._ngxsAction
      .pipe(takeUntil(this._unsubscribeAll), ofActionSuccessful(MessageAction.SendMessage))
      .subscribe(() => this.saveAndClose());
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  saveAndClose(): void {
    this.matDialogRef.close();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Actions
  // -----------------------------------------------------------------------------------------------------

  setCloudTemplate(selection: TemplateSelection): void {
    this.cloudSelection = selection;
    this._changeDetectorRef.markForCheck();
  }

  setMessage(message: ComposedMessage): void {
    this.messageToSend = message;
    this._changeDetectorRef.markForCheck();
  }

  sendMessage(): void {
    if (this.channelUnknown) {
      this._toastrService.error("Espace d'envoi en cours de chargement. Rechargez la page.", 'Envoi impossible');
      return;
    }
    if (this.isCloud && !this.cloudReady) {
      this._toastrService.error("L'organisation ne peut pas envoyer : vérifiez le numéro WhatsApp Business et la ligne de crédit", 'Envoi impossible');
      return;
    }
    if (this.isPersonal && !this.isWhatsAppReady) {
      this._toastrService.error(
        this.isWhatsAppSynced
          ? "La synchronisation WhatsApp est en cours. Veuillez patienter avant d'envoyer un message."
          : "Synchronisez votre compte WhatsApp avant d'envoyer un message",
        'WhatsApp indisponible'
      );
      return;
    }

    const result = buildSendPayload({
      channel: this.isCloud ? 'cloud' : 'personal',
      // Envoi a un contact : toujours immediat (pas de planification ici).
      isSentToNow: true,
      target: { contactIds: this.destinationContact?._id ? [this.destinationContact._id] : [], groupIds: [] },
      composition: {
        message: this.messageToSend.message ?? null,
        files: this.messageToSend.files || [],
        messageTemplateId: null,
      },
      cloudTemplate: this.cloudSelection?.template ?? null,
      cloudTemplateComplete: !!this.cloudSelection?.complete,
      planification: null,
      // Le solde est controle par le serveur (402) : pas d'estimation dans ce dialogue.
      costSufficient: true,
      composeError: this.messageToSend.error ?? null,
    });

    if (result.ok === false) {
      const toast = result.error.level === 'warning' ? this._toastrService.warning : this._toastrService.error;
      toast.call(this._toastrService, result.error.message, result.error.title);
      return;
    }

    this._store.dispatch(new MessageAction.SendMessage(result.payload));
  }
}
