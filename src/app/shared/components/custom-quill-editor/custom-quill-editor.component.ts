import { Component, EventEmitter, ViewChild,Output, Input, forwardRef } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { QuillEditorComponent } from 'ngx-quill';

@Component({
  selector: 'app-custom-quill-editor',
  templateUrl: './custom-quill-editor.component.html',
  styleUrls: ['./custom-quill-editor.component.scss'],
  providers:[
    {
      provide: NG_VALUE_ACCESSOR,
      multi:true,
      useExisting:  CustomQuillEditorComponent
    }
  ]
})
export class CustomQuillEditorComponent implements ControlValueAccessor{
  
  
  @ViewChild("quillEditor") quillEditor:QuillEditorComponent;

  @Output() onContentWriteChanged:EventEmitter<any>=new EventEmitter<any>()
  quillEditorRef:any=null;

  onChange = (content) => {};

  onTouched = () => {};

  contentWrite:string=""

  quillModules: any = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons

        [{ 'list': 'ordered'}, { 'list': 'bullet' }],

        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        ['link'],     
        
        [{ 'templatevars': ['','senderFullName', 'senderEmail','receiverFullName','receiverEmail','dateToSend','plateform'] }], // my custom dropdown
    ],
      handlers: {
        "templatevars":(value) =>this.templateVars(value)
      }
    },
  };


  writeValue(obj: any): void {
    this.contentWrite = obj;
    
  }
  registerOnChange(fn: any): void {
   this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched=fn;
  }

  templateVars(value)
  {
    if(!value) return;
    const cursorPosition = this.quillEditorRef.getSelection().index
    value = `{{${value}}} `
    this.quillEditorRef.insertText(cursorPosition,value)
    this.quillEditorRef.setSelection(cursorPosition + value.length);
  }

  onEditorCreated(quillEditor)
  {
    this.quillEditorRef = quillEditor;

    const templateVarsPickerItems = this.quillEditor.elementRef.nativeElement.querySelectorAll('.ql-templatevars .ql-picker-item');

    templateVarsPickerItems.forEach((item:any) => item.textContent = item.dataset.value);

    this.quillEditor.elementRef.nativeElement.querySelector('.ql-templatevars .ql-picker-label').innerHTML = ' Var Template ' + this.quillEditor.elementRef.nativeElement.querySelector('.ql-templatevars .ql-picker-label').innerHTML;

  }

  loseFocus(content)
  {
    this.onChange(content.html)
    this.onContentWriteChanged.next(content.html)
  }
}
