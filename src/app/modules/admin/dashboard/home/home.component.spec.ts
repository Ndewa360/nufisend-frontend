import { HttpClientTestingModule } from '@angular/common/http/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgxsModule } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { ContactState, GroupState, MessageTemplateState } from 'app/shared/store';
import { PlanificationState } from 'app/shared/store/planifcation';
import { classifyPlanifications, HomeComponent } from './home.component';

describe('classifyPlanifications', () => {
  it('counts an active, funded, non exhausted plan as in progress', () => {
    expect(classifyPlanifications([{ isActive: true, billingStatus: 'ok', isExhausted: false }])).toEqual({
      inProgress: 1, inactive: 0, suspended: 0, ended: 0,
    });
  });

  it('never counts an inactive plan as in progress', () => {
    expect(classifyPlanifications([{ isActive: false, billingStatus: 'ok', isExhausted: false }]).inProgress).toBe(0);
  });

  it('separates suspended (insufficient funds) and ended plans', () => {
    const result = classifyPlanifications([
      { isActive: true, billingStatus: 'suspended_insufficient_funds', isExhausted: false },
      { isActive: true, billingStatus: 'ok', isExhausted: true },
      { isActive: false, billingStatus: 'ok', isExhausted: true },
    ]);
    expect(result).toEqual({ inProgress: 0, inactive: 1, suspended: 1, ended: 1 });
  });

  it('returns zeros for an empty list', () => {
    expect(classifyPlanifications([])).toEqual({ inProgress: 0, inactive: 0, suspended: 0, ended: 0 });
  });
});

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HomeComponent],
      imports: [
        HttpClientTestingModule,
        NgxsModule.forRoot([ContactState, GroupState, MessageTemplateState, PlanificationState]),
      ],
      providers: [{ provide: ToastrService, useValue: { error: () => undefined, warning: () => undefined } }],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts with an empty breakdown and no error', () => {
    expect(component.breakdown).toEqual({ inProgress: 0, inactive: 0, suspended: 0, ended: 0 });
    expect(component.planificationsError).toBe(false);
  });

  it('uses the personal scope label when there is no organization membership', () => {
    component.membership = null;
    expect(component.annuaireScopeLabel).toBe('Privés');
  });

  it('uses the organization scope label for a member', () => {
    component.membership = { organization: { _id: 'org' } } as any;
    expect(component.annuaireScopeLabel).toBe('Organisation');
  });
});
