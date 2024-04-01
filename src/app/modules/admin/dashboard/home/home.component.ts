import { Component, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ContactModel, ContactState, GroupModel, GroupState, MessageTemplateState } from 'app/shared/store';
import { PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { Observable, combineLatest } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{

  @Select(GroupState.selectStateLoading) loadingGroups$:Observable<boolean>;
  @Select(ContactState.selectStateLoading) loadingContacts$:Observable<boolean>;
  @Select(MessageTemplateState.selectStateLoading) loadingTemplateMessage$:Observable<boolean>;
  @Select(PlanificationState.selectStateLoading) loadingPlanification$:Observable<boolean>;

  @Select(GroupState.selectStateData) groups$:Observable<GroupModel[]>;
  @Select(ContactState.selectStateData) contacts$:Observable<ContactModel[]>;
  @Select(MessageTemplateState.selectStateData) templateMessage$:Observable<MessageTemplateState[]>;
  @Select(PlanificationState.selectStateData) planification$:Observable<PlanificationModel[]>;


  loading=false;

  constructor(private _store:Store){}

  ngOnInit(): void {
    combineLatest(this.loadingContacts$,this.loadingGroups$,this.loadingTemplateMessage$,this.loadingPlanification$)
      .subscribe(([loadingContact,loadingGoup,loadingTemplate,loadingPlaning])=>this.loading=loadingContact || loadingGoup || loadingTemplate || loadingPlaning)
  }

}
