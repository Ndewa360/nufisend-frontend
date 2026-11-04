import { DOCUMENT } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit,AfterViewInit,OnDestroy {
 
  @ViewChild("dropzone") dropzoneHtml:ElementRef;
  @ViewChild("inputDropzone") inputDropzone:ElementRef;
  @Input() isMultiple:boolean=false;
  @Input() acceptedFile = "PDF, WORD, PPTX or PNG (MAX. 800x400px)"
  @Input() acceptedFileType ="image/*,video/*,audio/*,.pdf,.doc,.docx,.pptx,.xls,.xlsx"
  
  
  /** Filtre optionnel : fichiers retenus et messages des fichiers refuses. */
  @Input() validateFiles: (current: File[], added: File[]) => { accepted: File[]; errors: string[] } = null;

  @Output() uploadFileEvent:EventEmitter<File[]>=new EventEmitter<File[]>();
  files:File[]=[]
  errors:string[]=[]
  /** Apercus (URL blob) crees une fois par fichier et liberes a la suppression. */
  private previews = new Map<File, { raw: string; safe: SafeUrl }>();
  fileDragging: null;
  fileDropping: null;
  constructor(@Inject(DOCUMENT) private document: Document, private sanitizer: DomSanitizer) {}
  
  ngAfterViewInit(): void { 
    // this.dropzoneHtml.nativeElement.      
  }

  ngOnInit(): void {}

  uploadFile(event: any)
  {
    this.addFiles(this.isMultiple?event.target.files:[event.target.files[0]])
    // Permet de selectionner a nouveau le meme fichier apres l'avoir retire.
    event.target.value = '';
  }

        
  humanFileSize(size) {
      const i = Math.floor(Math.log(size) / Math.log(1024));
      return `${(size / Math.pow(1024, i)).toFixed(2)} ${["B", "kB", "MB", "GB", "TB"][i]}`;
  }
  remove(event,index) {
    event.preventDefault();
    event.stopPropagation();
    const [removed] = this.files.splice(index, 1);
    this.releasePreview(removed);
    this.errors = [];
    this.uploadFileEvent.emit([...this.files])
  }

  startDrag($event){}

  dropFile(event)
  {
    event.preventDefault();
    event.stopPropagation();
    event.target.classList.remove('border-gray-800');  
    this.addFiles(this.isMultiple?event.dataTransfer.files: [event.dataTransfer.files[0]]);
  }


  addFiles(files) {
    const added = Array.from(files || []).filter(Boolean) as File[];
    const current = this.isMultiple ? this.files : [];
    if (this.validateFiles) {
      const { accepted, errors } = this.validateFiles(current, added);
      this.errors = errors;
      this.setFiles(accepted);
    } else {
      this.errors = [];
      this.setFiles([...current, ...added]);
    }
    this.uploadFileEvent.emit([...this.files])
  }

  private setFiles(files: File[]) {
    for (const file of this.files) if (!files.includes(file)) this.releasePreview(file);
    this.files = files;
  }
  


  dragEnter(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.add('border-gray-800');
  }

  dragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('border-gray-800');
  }


  clickToFile()
  {
    this.inputDropzone.nativeElement.click();
  }

  loadFile(file: File): SafeUrl {
      let preview = this.previews.get(file);
      if (!preview) {
          const raw = this.document.defaultView.URL.createObjectURL(file);
          preview = { raw, safe: this.sanitizer.bypassSecurityTrustUrl(raw) };
          this.previews.set(file, preview);
      }
      return preview.safe;
  }

  private releasePreview(file: File) {
      const preview = file && this.previews.get(file);
      if (!preview) return;
      this.document.defaultView.URL.revokeObjectURL(preview.raw);
      this.previews.delete(file);
  }

  ngOnDestroy(): void {
      for (const file of [...this.previews.keys()]) this.releasePreview(file);
  }

  

}
