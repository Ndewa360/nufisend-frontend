import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewMessageForSingleContactComponent } from './new-message-for-single-contact.component';

describe('NewMessageForSingleContactComponent', () => {
  let component: NewMessageForSingleContactComponent;
  let fixture: ComponentFixture<NewMessageForSingleContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NewMessageForSingleContactComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewMessageForSingleContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
