import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PrevisualizeDataFileComponent } from './previsualize-data-file.component';

describe('PrevisualizeDataFileComponent', () => {
  let component: PrevisualizeDataFileComponent;
  let fixture: ComponentFixture<PrevisualizeDataFileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PrevisualizeDataFileComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PrevisualizeDataFileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
