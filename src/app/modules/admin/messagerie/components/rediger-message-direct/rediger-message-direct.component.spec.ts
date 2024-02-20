import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedigerMessageDirectComponent } from './rediger-message-direct.component';

describe('RedigerMessageDirectComponent', () => {
  let component: RedigerMessageDirectComponent;
  let fixture: ComponentFixture<RedigerMessageDirectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RedigerMessageDirectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedigerMessageDirectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
