import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlanifierDateEnvoiComponent } from './planifier-date-envoi.component';

describe('PlanifierDateEnvoiComponent', () => {
  let component: PlanifierDateEnvoiComponent;
  let fixture: ComponentFixture<PlanifierDateEnvoiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PlanifierDateEnvoiComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlanifierDateEnvoiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
