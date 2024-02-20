import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-select-message-type',
  templateUrl: './select-message-type.component.html',
  styleUrls: ['./select-message-type.component.scss']
})
export class SelectMessageTypeComponent implements OnInit {
  messagesType: any[];
  messagesTypeForm: UntypedFormGroup;
  private _unsubscribeAll: Subject<any> = new Subject<any>();

  @Output() isSentToNow:EventEmitter<boolean> = new EventEmitter<boolean>();
  /**
     * Constructor
     */
  constructor(
    private _formBuilder: UntypedFormBuilder
)
{
}

  ngOnInit(): void {
    this.messagesTypeForm = this._formBuilder.group({
      messageType          : ['direct'],
    });

    // Setup the plans
    this.messagesType = [
      {
        value  : 'direct',
        label  : 'Direct',
        details: 'Message à envoi direct',
        icon   :"feather:send"

    },   
      {
        value  : 'indirect',
        label  : 'Planifier',
        details: 'Message planifier. la date d\'envoi est a préciser',
        icon   :"mat_outline:schedule"
      } ,
           
    ];
    this.selectMessageType("direct")
  }

  selectMessageType(messageType)
  {
    if(messageType=="direct") return this.isSentToNow.next(true)
    this.isSentToNow.next(false);
  }

  // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
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
}
