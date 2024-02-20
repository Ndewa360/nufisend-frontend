import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedigerMessagePlanifierComponent } from './rediger-message-planifier.component';

describe('RedigerMessagePlanifierComponent', () => {
  let component: RedigerMessagePlanifierComponent;
  let fixture: ComponentFixture<RedigerMessagePlanifierComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RedigerMessagePlanifierComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedigerMessagePlanifierComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
