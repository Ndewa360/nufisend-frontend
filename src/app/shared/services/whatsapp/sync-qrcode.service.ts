import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserProfileAction } from 'app/shared/store/user-profile';
import { BehaviorSubject, map } from 'rxjs';
import { WebsocketManagerService } from '../websocket-manager/websocket-manager.service';

@Injectable({
  providedIn: 'root'
})
export class SyncQrcodeService {

  qrCode:BehaviorSubject<string>=new BehaviorSubject<string>(null);
  constructor(private socket: WebsocketManagerService,private store:Store) {
    this.handleSuccessfullySync();
    this.handleSuccessfullyUnSync();
  }


  subscribeToQrCode()
  {
    this.socket.on('qrcode', data=>this.qrCode.next(data));
  }

  unSubscribeToQrCode(userEmail)
  {
    this.store.dispatch(new UserProfileAction.updateLoadingUserProfileState(true))
    this.socket.emit("disconnexion",{email:userEmail})
  }

  handleSuccessfullySync()
  {
    this.socket.on('connected', ()=>{
      this.store.dispatch(new UserProfileAction.UpdateUserWhatsappSyncProfile(true))
    });
  }

 

  handleSuccessfullyUnSync()
  {
    this.socket.on('disconnected', (value)=>{
      this.store.dispatch(new UserProfileAction.UpdateUserWhatsappSyncProfile(false))
      this.store.dispatch(new UserProfileAction.updateLoadingUserProfileState(false))
      console.log("disconnected")
    });
  }

  

}
