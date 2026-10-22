import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { Socket } from 'ngx-socket-io';
import { Subject } from 'rxjs';
import { SyncQrcodeService } from '../whatsapp/sync-qrcode.service';
import { WhatsappDataService } from '../whatsapp/whatsapp-data.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketManagerService {

  webSocketConnectedEvent: Subject<boolean> = new Subject();

  constructor(
    private store: Store,
    private socket: Socket,
    private syncQrCodeService: SyncQrcodeService,
    private whatsAppDataService: WhatsappDataService
  ) {}

  /**
   * Called after a successful login/token-check.
   * Injects the JWT into the socket auth and connects if not already connected.
   * Does NOT emit 'connexion' — that is only done explicitly by startSync().
   */
  customConnexion(value: any): void {
    const token = localStorage.getItem('accessToken') ?? '';
    console.log('[WSMan] customConnexion email=', value?.email, 'token present=', !!token);

    try {
      (this.socket.ioSocket as any).auth = { token };

      if (!this.socket.ioSocket.connected) {
        console.log('[WSMan] socket not connected, connecting...');
        this.socket.ioSocket.connect();
      } else {
        console.log('[WSMan] socket already connected');
      }
    } catch (e) {
      console.log('[WSMan] Socket connection error', e);
    }

    this.webSocketConnectedEvent.next(true);
  }
}
