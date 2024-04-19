import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SignInupComponent } from './sign-inup.component';

describe('SignInupComponent', () => {
  let component: SignInupComponent;
  let fixture: ComponentFixture<SignInupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SignInupComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SignInupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
