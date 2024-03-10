import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePlanningListComponent } from './home-planning-list.component';

describe('HomePlanningListComponent', () => {
  let component: HomePlanningListComponent;
  let fixture: ComponentFixture<HomePlanningListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ HomePlanningListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HomePlanningListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
