import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuillModule } from 'ngx-quill';
import { CustomQuillEditorComponent } from 'app/shared/components/custom-quill-editor/custom-quill-editor.component';

/**
 * Editeur de texte riche (Quill). Importe uniquement par les modules qui
 * redigent des messages, pour ne pas alourdir le bundle initial.
 */
@NgModule({
    declarations: [CustomQuillEditorComponent],
    imports: [CommonModule, FormsModule, QuillModule.forRoot()],
    exports: [CustomQuillEditorComponent, QuillModule],
})
export class RichTextEditorModule
{
}
