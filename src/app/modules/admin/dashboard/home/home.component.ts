import { Component, OnDestroy, OnInit } from '@angular/core';
import { Select } from '@ngxs/store';
import { ContactModel, ContactState, GroupModel, GroupState, MessageTemplateModel, MessageTemplateState } from 'app/shared/store';
import { PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { OrganizationService } from 'app/core/organization/organization.service';
import { Membership } from 'app/core/organization/organization.types';
import { Observable, Subject, combineLatest, takeUntil } from 'rxjs';

/** Repartition des planifications selon ce qui leur arrive reellement. */
export interface PlanificationBreakdown {
  inProgress: number;
  inactive: number;
  suspended: number;
  ended: number;
}

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

  @Select(GroupState.selectStateLoadError) groupsError$:Observable<boolean>;
  @Select(ContactState.selectStateLoadError) contactsError$:Observable<boolean>;
  @Select(MessageTemplateState.selectStateLoadError) templatesError$:Observable<boolean>;
  @Select(PlanificationState.selectStateLoadError) planificationsError$:Observable<boolean>;

  loading = false;
  groupsCount = 0;
  contactsCount = 0;
  templatesCount = 0;
  groupsError = false;
  contactsError = false;
  templatesError = false;
  planificationsError = false;
  breakdown: PlanificationBreakdown = { inProgress: 0, inactive: 0, suspended: 0, ended: 0 };

  /** Adhesion : undefined = non chargee, null = compte personnel, objet = membre. */
  membership: Membership | null | undefined = undefined;

  private _unsubscribeAll = new Subject<void>();

  constructor(private _organizationService: OrganizationService){}

  /**
   * Portee des contacts, groupes et modeles : annuaire de l'organisation pour un membre,
   * donnees personnelles sinon. Les planifications restent toujours personnelles.
   */
  get annuaireScopeLabel(): string
  {
    return this.membership ? 'Organisation' : 'Privés';
  }

  ngOnInit(): void {
    combineLatest([this.loadingContacts$, this.loadingGroups$, this.loadingTemplateMessage$, this.loadingPlanification$])
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe(([loadingContact, loadingGroup, loadingTemplate, loadingPlaning]) =>
        this.loading = loadingContact || loadingGroup || loadingTemplate || loadingPlaning
      );

    this.groups$.pipe(takeUntil(this._unsubscribeAll)).subscribe((items) => this.groupsCount = items?.length || 0);
    this.contacts$.pipe(takeUntil(this._unsubscribeAll)).subscribe((items) => this.contactsCount = items?.length || 0);
    this.templateMessage$.pipe(takeUntil(this._unsubscribeAll)).subscribe((items) => this.templatesCount = items?.length || 0);

    this.groupsError$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => this.groupsError = !!value);
    this.contactsError$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => this.contactsError = !!value);
    this.templatesError$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => this.templatesError = !!value);
    this.planificationsError$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value) => this.planificationsError = !!value);

    this.planification$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((plans) => this.breakdown = this._classify(plans || []));

    this._organizationService.membership$
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((membership) => this.membership = membership);
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(undefined);
    this._unsubscribeAll.complete();
  }

  private _classify(plans: PlanificationModel[]): PlanificationBreakdown
  {
    return classifyPlanifications(plans);
  }
}

/**
 * Une planification est "en cours" si elle est active, que son solde couvre les envois
 * et qu'elle n'est pas epuisee. Chaque autre cas est compte a part.
 */
export function classifyPlanifications(plans: PlanificationModel[]): PlanificationBreakdown
{
  const breakdown: PlanificationBreakdown = { inProgress: 0, inactive: 0, suspended: 0, ended: 0 };
  plans.forEach((plan) => {
    if (!plan.isActive) breakdown.inactive++;
    else if (plan.billingStatus && plan.billingStatus !== 'ok') breakdown.suspended++;
    else if (plan.isExhausted) breakdown.ended++;
    else breakdown.inProgress++;
  });
  return breakdown;
}
