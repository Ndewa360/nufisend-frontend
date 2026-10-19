import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserProfileAction } from 'app/shared/store/user-profile';
import { WhatsappQrCodeAction } from 'app/shared/store';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class SyncQrcodeService {

  constructor(private socket: Socket, private store: Store) {
    this.initSubscriptionEvent();
  }

  initSubscriptionEvent()
  {
    this.handleSuccessfullySync();
    this.handleSuccessfullyUnSync();
    this.subscribeToQrCode()
  }

  subscribeToQrCode()
  {
    console.log("Qr Code Start")
    this.socket.on('qrcode', data=>{
    console.log("Qr Code",data)
      this.store.dispatch([
        new WhatsappQrCodeAction.SetLoadingQrCode(false),
        new WhatsappQrCodeAction.SetWhatsAppQrCode(data)
      ])
    });
  }

  /**
   * Ask the backend to (re)start a WhatsApp sync session and generate a fresh
   * QR code. The backend derives the user from the authenticated socket.
   */
  startSync()
  {
    this.store.dispatch([
      new WhatsappQrCodeAction.SetLoadingQrCode(true),
      new WhatsappQrCodeAction.SetWhatsAppQrCode(null)
    ])
    this.socket.emit("connexion", {})
  }

  unSubscribeToQrCode(userEmail)
  {
    this.store.dispatch(
      [
        new WhatsappQrCodeAction.SetLoadingQrCode(true),
        new WhatsappQrCodeAction.SetWhatsAppQrCode(null),
        new UserProfileAction.updateLoadingUserProfileState(true)
      ]
    )
    this.socket.emit("disconnexion",{email:userEmail})
  }

  handleSuccessfullySync()
  {
    this.socket.on('sync-connected', ()=>{
      this.store.dispatch(new UserProfileAction.UpdateUserWhatsappSyncProfile(true))
    });
  }

  handleSuccessfullyUnSync()
  {
    this.socket.on('disconnected', (value)=>{
      this.store.dispatch(new UserProfileAction.UpdateUserWhatsappSyncProfile(false))
      this.store.dispatch(new UserProfileAction.updateLoadingUserProfileState(false))
    });
  }
}
