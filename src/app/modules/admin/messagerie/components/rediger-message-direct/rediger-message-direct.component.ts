import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';
import { Select, Store } from '@ngxs/store';
import { MessageTemplateAction, MessageTemplateModel, MessageTemplateState } from 'app/shared/store';
import { Observable, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-rediger-message-direct',
  templateUrl: './rediger-message-direct.component.html',
  styleUrls: ['./rediger-message-direct.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush

})
export class RedigerMessageDirectComponent implements OnInit,AfterViewInit{
  @ViewChild("matForm") matFormAutoComplete:ElementRef;
  @ViewChild(MatAutocompleteTrigger) autocompleteTrigger: MatAutocompleteTrigger;
  
  @Select(MessageTemplateState.selectStateData) messageTemplateDataList$:Observable<MessageTemplateModel[]>;
  @Select(MessageTemplateState.selectStateLoading) loadingMessageTemplate$:Observable<boolean>
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  messageTemplateFiltered=[];
  messageTemplateAll=[];
  selectedMessageTemplate:MessageTemplateModel=null;
  selectedFiles:File[]=[];

  @Output() sendMessageData:EventEmitter<{messageTemplate:MessageTemplateModel,message:string,file?:File}> = new EventEmitter();
  composeForm: UntypedFormGroup;
    copyFields: { cc: boolean; bcc: boolean } = {
        cc : false,
        bcc: false
    };
    quillModules: any = {
      toolbar: [
        ['bold', 'italic', 'underline', 'strike'],        // toggled buttons

        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript

        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

        [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme

        ['clean'],                                         // remove formatting button

        ['link']           ,
        // [{'insert':["{{email}}","{{numPhone}}"]}],

        [ { "custom": ["ced1","ced2"],value:"Ced" }]
            
    ],
    };

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _store:Store,
        private _changeDetectorRef: ChangeDetectorRef,

    )
    {
    }
  ngAfterViewInit(): void {
    console.log("Native Blur",this.matFormAutoComplete.nativeElement)
    this.matFormAutoComplete.nativeElement.blur();
    this.autocompleteTrigger.closePanel();
  }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Create the form
        this.composeForm = this._formBuilder.group({
            subject: [''],
            body   : ['', [Validators.required]]
        });

        this._store.dispatch(new MessageTemplateAction.FetchAllMessageTemplate())
        this.messageTemplateDataList$.pipe(takeUntil(this._unsubscribeAll))
        .subscribe((msgTmplModelList: MessageTemplateModel[]) => {
            
            // Update the counts
            this.messageTemplateFiltered=[...msgTmplModelList]
            this.messageTemplateAll=[...msgTmplModelList]
            // Mark for check
            this._changeDetectorRef.markForCheck();
        });

      this.composeForm.controls.subject.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                tap((query:string) =>
                    {
                        console.log("Query ",query)
                        if(query.length<2)
                        {
                            this.messageTemplateFiltered=[...this.messageTemplateAll]
                        }
                        // Search
                        else this.messageTemplateAll=this.messageTemplateAll.filter
                            (
                                (msgTmpModel:MessageTemplateModel)=> `${msgTmpModel.title}`.toLowerCase().includes(query.toLowerCase())
                            )
                        // Mark for check
                        this._changeDetectorRef.markForCheck();
                    }
                )
            )
            .subscribe();
       // Mark for check
       this._changeDetectorRef.markForCheck();

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    /**
     * Save and close
     */
    saveAndClose(): void
    {
        // Save the message as a draft
        this.saveAsDraft();

    }

    selectMessageTemplate(msgTmpModel:MessageTemplateModel)
    {
      this.selectedMessageTemplate=msgTmpModel;
      this.composeForm.controls.body.setValue(msgTmpModel.content)
      this.composeForm.controls.body.disable({onlySelf:true})
      this.sendMessage(msgTmpModel,null, this.selectedFiles.length>0?this.selectedFiles[0]:null)

      // Mark for check
      this._changeDetectorRef.markForCheck();
    }

    removeMessageTemplate(msgTmpModel)
    {
      this.selectedMessageTemplate=null;
      this.composeForm.controls.body.setValue("");
      this.sendMessage(null,null, this.selectedFiles.length>0?this.selectedFiles[0]:null)

      // Mark for check
      this._changeDetectorRef.markForCheck();
    }

    loseFocus()
    {
      this.sendMessage(null,this.composeForm.value.body, this.selectedFiles.length>0?this.selectedFiles[0]:null)
    }

    setFiles(files:File[])
    {
      console.log("files ",files)
      this.selectedFiles = [...files];

      this.sendMessage(this.selectedMessageTemplate,this.selectedMessageTemplate?null:this.composeForm.value.body,this.selectedFiles[0])
    }

    sendMessage(messageTemplate:MessageTemplateModel,message:string,file:File)
    {
      this.sendMessageData.next({messageTemplate:messageTemplate,message:message,file:file})
    }
    
    /**
     * Discard the message
     */
    discard(): void
    {

    }

    /**
     * Save the message as a draft
     */
    saveAsDraft(): void
    {

    }

    /**
     * Send the message
     */
    send(): void
    {

    }

    /**
     * On destroy
     */
  ngOnDestroy(): void
  {
      // Unsubscribe from all subscriptions
      this._unsubscribeAll.next(null);
      this._unsubscribeAll.complete();
  }

  /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
  trackByFn(index: number, item: any): any
  {
      return item._id || index;
  }
}
