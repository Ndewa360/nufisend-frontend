import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { UserProfileAction } from 'app/shared/store/user-profile';
import { WhatsappQrCodeAction, WhatsappContactAction } from 'app/shared/store';
import { Socket } from 'ngx-socket-io';

const log = (...args: any[]) => console.log('[SyncQR]', ...args);

@Injectable({
  providedIn: 'root'
})
export class SyncQrcodeService {

  constructor(private socket: Socket, private store: Store) {
    this.initSubscriptionEvent();
  }

  initSubscriptionEvent(): void
  {
    try {
      (this.socket.ioSocket as any).on('connect', () =>
        log('socket CONNECTED id=', (this.socket.ioSocket as any).id)
      );
      (this.socket.ioSocket as any).on('disconnect', (r: any) =>
        log('socket DISCONNECTED', r)
      );
      (this.socket.ioSocket as any).on('connect_error', (e: any) =>
        log('socket CONNECT_ERROR', e?.message || e)
      );
    } catch (e) {
      log('could not attach socket lifecycle handlers', e);
    }

    this.handleSuccessfullySync();
    this.handleSuccessfullyUnSync();
    this.subscribeToQrCode();
    this.handleSyncError();
  }

  subscribeToQrCode(): void
  {
    this.socket.on('qrcode', (data: string) => {
      log('<< RECEIVED qrcode (len=' + (data?.length ?? 0) + ')');
      this.store.dispatch([
        new WhatsappQrCodeAction.SetLoadingQrCode(false),
        new WhatsappQrCodeAction.SetWhatsAppQrCode(data)
      ]);
    });
  }

  /**
   * Ask the backend to (re)start a WhatsApp sync session.
   * Waits for the socket to be connected before emitting.
   */
  startSync(): void
  {
    log('startSync() called, socket connected=', this.socket.ioSocket?.connected);

    this.store.dispatch([
      new WhatsappQrCodeAction.SetLoadingQrCode(true),
      new WhatsappQrCodeAction.SetWhatsAppQrCode(null),
      new WhatsappContactAction.SetSyncError(null)
    ]);

    if (this.socket.ioSocket?.connected) {
      log('startSync() -> emitting connexion immediately');
      this.socket.emit('connexion', {});
    } else {
      log('startSync() -> socket not connected, waiting for connect event');
      const onConnect = () => {
        log('startSync() -> socket connected, emitting connexion');
        this.socket.emit('connexion', {});
        (this.socket.ioSocket as any).off('connect', onConnect);
      };
      (this.socket.ioSocket as any).once('connect', onConnect);

      // Attempt to connect if not already connecting
      try {
        const token = localStorage.getItem('accessToken') ?? '';
        (this.socket.ioSocket as any).auth = { token };
        this.socket.ioSocket.connect();
      } catch (e) {
        log('startSync() socket connect error', e);
        this.store.dispatch([
          new WhatsappQrCodeAction.SetLoadingQrCode(false),
          new WhatsappContactAction.SetSyncError("Impossible de se connecter au serveur.")
        ]);
      }
    }
  }

  unSubscribeToQrCode(userEmail: string): void
  {
    log('unSubscribeToQrCode() -> emitting disconnexion');
    this.store.dispatch([
      new WhatsappQrCodeAction.SetLoadingQrCode(true),
      new WhatsappQrCodeAction.SetWhatsAppQrCode(null),
      new UserProfileAction.updateLoadingUserProfileState(true)
    ]);
    this.socket.emit('disconnexion', { email: userEmail });
  }

  handleSuccessfullySync(): void
  {
    this.socket.on('sync-connected', () => {
      log('<< RECEIVED sync-connected -> patching profile hasSyncWhatsApp=true');
      this.store.dispatch([
        new UserProfileAction.UpdateUserWhatsappSyncProfile(true),
        new UserProfileAction.updateLoadingUserProfileState(false),
        new WhatsappQrCodeAction.SetLoadingQrCode(false),
        new WhatsappQrCodeAction.SetWhatsAppQrCode(null)
      ]).subscribe(() => log('sync-connected dispatched OK'));
    });
  }

  handleSuccessfullyUnSync(): void
  {
    this.socket.on('disconnected', () => {
      log('<< RECEIVED disconnected');
      this.store.dispatch([
        new UserProfileAction.UpdateUserWhatsappSyncProfile(false),
        new UserProfileAction.updateLoadingUserProfileState(false),
        new WhatsappQrCodeAction.SetLoadingQrCode(false)
      ]);
    });
  }

  handleSyncError(): void
  {
    this.socket.on('sync-error', (value: any) => {
      log('<< RECEIVED sync-error', value);
      this.store.dispatch([
        new WhatsappQrCodeAction.SetLoadingQrCode(false),
        new UserProfileAction.updateLoadingUserProfileState(false),
        new WhatsappContactAction.SetSyncError(
          value?.message || 'Echec de la synchronisation WhatsApp'
        )
      ]);
    });
  }
}
