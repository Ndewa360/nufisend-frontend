import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { WhatsappContactModel, WhatsappContactAction, GlobalAction } from 'app/shared/store';
import { BehaviorSubject } from 'rxjs';
import { WebsocketManagerService } from '../websocket-manager/websocket-manager.service';
import { Socket } from 'ngx-socket-io';
// import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class WhatsappDataService {
  whatsappProfil:BehaviorSubject<Object>=new BehaviorSubject<Object>({});
  whatsappContactList:BehaviorSubject<WhatsappContactModel[]>=new BehaviorSubject<WhatsappContactModel[]>([]);
  constructor(private socket: Socket,private store:Store) {
    this.handleWhatsappInfo()
  }

  handleWhatsappInfo()
  {
    this.socket.on('info',(value)=>{
      this.store.dispatch([
        new GlobalAction.ChangeWhatsAppConnectedStatus(true),
        new WhatsappContactAction.SetAllWhatsappContactToLocal(value.contacts),
        new WhatsappContactAction.SetLoadingState(false)
      ]);
    })
    
    // this.socket.on('ready',()=>this.store.dispatch(new WhatsappContactAction.SetLoadingState(true)))
    this.socket.on('info-loading-percent',(value)=>{
      this.store.dispatch(new WhatsappContactAction.SetLoadingPercent(value.percent));
    })
  }
 
}
