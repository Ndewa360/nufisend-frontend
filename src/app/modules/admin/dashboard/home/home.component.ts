import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { ContactModel, ContactState, GroupModel, GroupState, MessageTemplateModel, MessageTemplateState } from 'app/shared/store';
import { PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { Observable, Subject, combineLatest, takeUntil } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {

  @Select(GroupState.selectStateLoading) loadingGroups$:Observable<boolean>;
  @Select(ContactState.selectStateLoading) loadingContacts$:Observable<boolean>;
  @Select(MessageTemplateState.selectStateLoading) loadingTemplateMessage$:Observable<boolean>;
  @Select(PlanificationState.selectStateLoading) loadingPlanification$:Observable<boolean>;

  @Select(GroupState.selectStateData) groups$:Observable<GroupModel[]>;
  @Select(ContactState.selectStateData) contacts$:Observable<ContactModel[]>;
  @Select(MessageTemplateState.selectStateData) templateMessage$:Observable<MessageTemplateModel[]>;
  @Select(PlanificationState.selectStateData) planification$:Observable<PlanificationModel[]>;


  loading=false;
  private _unsubscribeAll = new Subject<void>();

  constructor(private _store:Store){}

  ngOnInit(): void {
    combineLatest([this.loadingContacts$, this.loadingGroups$, this.loadingTemplateMessage$, this.loadingPlanification$])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([loadingContact, loadingGroup, loadingTemplate, loadingPlaning]) =>
        this.loading = loadingContact || loadingGroup || loadingTemplate || loadingPlaning
      );
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(undefined);
    this._unsubscribeAll.complete();
  }

}
