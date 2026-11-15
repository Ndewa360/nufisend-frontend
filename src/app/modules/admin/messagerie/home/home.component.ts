import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NewMessageComponent } from '../new-message/new-message.component';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { GlobalState } from 'app/shared/store';
import { PlanificationAction, PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { MessagingChannel, isChannelReady, isOrganizationCloudReady, resolveMessagingChannel } from 'app/core/organization/messaging-channel';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  user:UserProfileModel=null;
  isWhatsAppReady:boolean=false;
  /** Adhesion : undefined = non chargee, null = compte personnel, objet = membre. */
  membership: Membership | null | undefined = undefined;
  @Select(UserProfileState.selectStateData) loadUserProfil$:Observable<UserProfileModel>
  @Select(GlobalState.isWhatsAppReady) isWhatsAppReady$:Observable<boolean>;
  @Select(GlobalState.selectWhatsAppSyncStatus) whatsappSync$:Observable<{status:string, progress:number, message:string}>;
  @Select(PlanificationState.selectStateData) planificationList$:Observable<PlanificationModel[]>;
  @Select(PlanificationState.selectStateLoading) loading$:Observable<boolean>;
  
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  countPlanification={total:0,active:0,inactive:0}

  constructor(
    private _matDialog: MatDialog,
    private _store:Store, 
    private _organizationService: OrganizationService,
  ){}

  /** Canal d'envoi effectif : organisation, compte personnel ou inconnu. */
  get channel(): MessagingChannel
  {
    return resolveMessagingChannel(this.membership);
  }

  /** Organisation prete a envoyer (numero WhatsApp Business raccorde). */
  get cloudReady(): boolean
  {
    return isOrganizationCloudReady(this.membership);
  }

  /** Vrai si l'utilisateur peut envoyer maintenant, quel que soit le canal. */
  get canSend(): boolean
  {
    return isChannelReady(this.membership, this.isWhatsAppReady);
  }

  get sendBlockedReason(): string
  {
    if (this.canSend) return '';
    switch (this.channel) {
      case 'cloud': return "L'organisation ne peut pas envoyer pour le moment";
      case 'personal': return 'La synchronisation WhatsApp doit être terminée pour envoyer un message';
      default: return "Espace d'envoi en cours de chargement";
    }
  }


  ngOnInit(): void {
    this.loadUserProfil$.subscribe((user)=>this.user=user)
    this.isWhatsAppReady$.subscribe((value)=>this.isWhatsAppReady=!!value)
    this._organizationService.membership$.pipe(takeUntil(this._unsubscribeAll))
      .subscribe((membership)=>this.membership=membership)

    this.planificationList$.subscribe((value)=>{
      if(!value) return;
      let total=0,active=0,inactive=0;
      value.forEach((plan)=>{
        if(plan.isActive) active++;
        else inactive++;
        total++;
      })
      this.countPlanification={total,active,inactive}
    })
    
    // this._store.dispatch(new PlanificationAction.FetchAllPlanification())
  }

  
  newMessage()
  {
    if (!this.canSend) return;
    // Open the dialog
    const dialogRef = this._matDialog.open(NewMessageComponent,
      {
        height: '100%',
        minWidth: '100%',
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
