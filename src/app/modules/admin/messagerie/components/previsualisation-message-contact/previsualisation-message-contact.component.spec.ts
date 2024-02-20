import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevisualisationMessageContactComponent } from './previsualisation-message-contact.component';

describe('PrevisualisationMessageContactComponent', () => {
  let component: PrevisualisationMessageContactComponent;
  let fixture: ComponentFixture<PrevisualisationMessageContactComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrevisualisationMessageContactComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevisualisationMessageContactComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
