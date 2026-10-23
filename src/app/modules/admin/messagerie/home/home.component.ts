import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NewMessageComponent } from '../new-message/new-message.component';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { GlobalState } from 'app/shared/store';
import { PlanificationAction, PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  user:UserProfileModel=null;
  isWhatsAppReady:boolean=false;
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
  ){}


  ngOnInit(): void {
    this.loadUserProfil$.subscribe((user)=>this.user=user)
    this.isWhatsAppReady$.subscribe((value)=>this.isWhatsAppReady=!!value)

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
