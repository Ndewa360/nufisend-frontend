import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectMessageTypeComponent } from './select-message-type.component';

describe('SelectMessageTypeComponent', () => {
  let component: SelectMessageTypeComponent;
  let fixture: ComponentFixture<SelectMessageTypeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectMessageTypeComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectMessageTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
