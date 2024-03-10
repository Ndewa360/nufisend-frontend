import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomQuillEditorComponent } from './custom-quill-editor.component';

describe('CustomQuillEditorComponent', () => {
  let component: CustomQuillEditorComponent;
  let fixture: ComponentFixture<CustomQuillEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomQuillEditorComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomQuillEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
