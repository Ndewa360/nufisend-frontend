import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RedigerMessageComponent } from './rediger-message.component';

describe('RedigerMessageComponent', () => {
  let component: RedigerMessageComponent;
  let fixture: ComponentFixture<RedigerMessageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RedigerMessageComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RedigerMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
