import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrcodeSynchroStatutComponent } from './qrcode-synchro-statut.component';

describe('QrcodeSynchroStatutComponent', () => {
  let component: QrcodeSynchroStatutComponent;
  let fixture: ComponentFixture<QrcodeSynchroStatutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QrcodeSynchroStatutComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrcodeSynchroStatutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
