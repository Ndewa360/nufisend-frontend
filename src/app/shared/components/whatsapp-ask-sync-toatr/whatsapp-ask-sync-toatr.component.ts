import { Component, OnInit } from '@angular/core';
import { FuseAlertService } from '@fuse/components/alert';
import { Select } from '@ngxs/store';
import { GlobalAction, GlobalState, WhatsappContactState } from 'app/shared/store';
import { Observable, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-whatsapp-ask-sync-toatr',
  templateUrl: './whatsapp-ask-sync-toatr.component.html',
  styleUrls: ['./whatsapp-ask-sync-toatr.component.scss']
})
export class WhatsappAskSyncToatrComponent  implements OnInit{
  @Select(WhatsappContactState.selectStatePercent) loadingPercent$:Observable<number>;
  
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  percent=0;

  constructor(
    private _fuseAlertService: FuseAlertService 
  ){}
  ngOnInit(): void {
      this.loadingPercent$.pipe(takeUntil(this._unsubscribeAll)).subscribe((percent)=>{
        this.percent=percent;
    })

    
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
