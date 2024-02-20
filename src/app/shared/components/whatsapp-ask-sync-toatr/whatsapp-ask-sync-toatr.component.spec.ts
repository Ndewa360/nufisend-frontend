import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WhatsappAskSyncToatrComponent } from './whatsapp-ask-sync-toatr.component';

describe('WhatsappAskSyncToatrComponent', () => {
  let component: WhatsappAskSyncToatrComponent;
  let fixture: ComponentFixture<WhatsappAskSyncToatrComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WhatsappAskSyncToatrComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WhatsappAskSyncToatrComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
