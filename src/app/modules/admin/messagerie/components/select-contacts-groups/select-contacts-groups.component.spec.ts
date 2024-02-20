import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectContactsGroupsComponent } from './select-contacts-groups.component';

describe('SelectContactsGroupsComponent', () => {
  let component: SelectContactsGroupsComponent;
  let fixture: ComponentFixture<SelectContactsGroupsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectContactsGroupsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectContactsGroupsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
