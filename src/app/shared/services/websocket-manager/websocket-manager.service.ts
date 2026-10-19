import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
// import { UserService } from 'app/core/user/user.service';
import { UserProfileState } from 'app/shared/store/user-profile';
import { environment } from 'environments/environment';
import { Socket } from 'ngx-socket-io';
import { Subject, combineLatest } from 'rxjs';
import { SyncQrcodeService } from '../whatsapp/sync-qrcode.service';
import { WhatsappDataService } from '../whatsapp/whatsapp-data.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketManagerService{

  userInfos = null;
  webSocketConnectedEvent:Subject<boolean>=new Subject();
  constructor(
    private store:Store,
    private socket:Socket,
    private syncQrCodeService:SyncQrcodeService,
    private whatsAppDataService:WhatsappDataService
  ) {
  }

  customConnexion(value)
    {
      const token = localStorage.getItem('accessToken') ?? '';
      try {
        // Refresh the auth token used by the socket handshake and reconnect if
        // the previous (unauthenticated) attempt was rejected.
        (this.socket.ioSocket as any).auth = { token };
        if (!this.socket.ioSocket.connected) {
          this.socket.ioSocket.connect();
        }
      } catch (e) {
        console.log('Socket connection error', e);
      }
      this.socket.emit('connexion', {email: value?.email});
      this.webSocketConnectedEvent.next(true); 
    }
}
