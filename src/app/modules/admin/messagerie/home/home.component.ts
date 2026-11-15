import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { GlobalState } from 'app/shared/store';
import { classifyPlanifications, PlanificationAction, PlanificationBreakdown, PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { MessagingChannel, isChannelReady, isOrganizationCloudReady, resolveMessagingChannel } from 'app/core/organization/messaging-channel';
import { NewMessageComponent } from '../new-message/new-message.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  @Select(GlobalState.isWhatsAppReady) isWhatsAppReady$: Observable<boolean>;
  @Select(GlobalState.selectWhatsAppSyncStatus) whatsappSync$: Observable<{ status: string, progress: number, message: string }>;
  @Select(PlanificationState.selectStateData) planificationList$: Observable<PlanificationModel[]>;
  @Select(PlanificationState.selectStateLoading) loading$: Observable<boolean>;
  @Select(PlanificationState.selectStateLoadError) loadError$: Observable<boolean>;

  isWhatsAppReady = false;
  /** Adhesion : undefined = non chargee, null = compte personnel, objet = membre. */
  membership: Membership | null | undefined = undefined;
  breakdown: PlanificationBreakdown = { inProgress: 0, inactive: 0, suspended: 0, ended: 0 };
  total = 0;
  loadError = false;

  private _unsubscribeAll = new Subject<void>();

  constructor(
    private _matDialog: MatDialog,
    private _store: Store,
    private _organizationService: OrganizationService,
  ) {}

  /** Canal d'envoi effectif : organisation, compte personnel ou inconnu. */
  get channel(): MessagingChannel {
    return resolveMessagingChannel(this.membership);
  }

  /** Organisation prete a envoyer (numero WhatsApp Business raccorde). */
  get cloudReady(): boolean {
    return isOrganizationCloudReady(this.membership);
  }

  /** Vrai si l'utilisateur peut envoyer maintenant, quel que soit le canal. */
  get canSend(): boolean {
    return isChannelReady(this.membership, this.isWhatsAppReady);
  }

  get sendBlockedReason(): string {
    if (this.canSend) return '';
    switch (this.channel) {
      case 'cloud': return "L'organisation ne peut pas envoyer pour le moment";
      case 'personal': return 'La synchronisation WhatsApp doit être terminée pour envoyer un message';
      default: return "Espace d'envoi en cours de chargement";
    }
  }

  ngOnInit(): void {
    this.isWhatsAppReady$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => this.isWhatsAppReady = !!value);
    this._organizationService.membership$.pipe(takeUntil(this._unsubscribeAll)).subscribe((membership) => this.membership = membership);
    this.loadError$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => this.loadError = !!value);

    this.planificationList$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((plans) => {
        const list = plans || [];
        this.total = list.length;
        this.breakdown = classifyPlanifications(list);
      });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  newMessage(): void {
    if (!this.canSend) return;
    this._matDialog.open(NewMessageComponent, { height: '100%', minWidth: '100%' });
  }

  /** Relance le chargement des planifications apres une erreur. */
  retry(): void {
    this._store.dispatch(new PlanificationAction.FetchAllPlanification(true));
  }
}
