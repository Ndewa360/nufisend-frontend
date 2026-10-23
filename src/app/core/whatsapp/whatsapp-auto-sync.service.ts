import { Injectable, OnDestroy } from '@angular/core';
import { Store } from '@ngxs/store';
import { ToastrService } from 'ngx-toastr';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AuthService } from 'app/core/auth/auth.service';
import { UserProfileState } from 'app/shared/store/user-profile';
import { GlobalAction } from 'app/shared/store/global';
import { SyncQrcodeService } from 'app/shared/services/whatsapp/sync-qrcode.service';
import { WebsocketManagerService } from 'app/shared/services/websocket-manager/websocket-manager.service';
import { NotificationsService } from 'app/layout/common/notifications/notifications.service';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class WhatsAppAutoSyncService implements OnDestroy {
  private _unsubscribeAll = new Subject<any>();
  private _notSyncedNotificationId: string | null = null;
  private _syncProgressToast: any = null;
  private _lastProgressPercent = -1;
  private _hasAutoStarted = false;

  constructor(
    private _authService: AuthService,
    private _store: Store,
    private _toastr: ToastrService,
    private _syncQr: SyncQrcodeService,
    private _wsManager: WebsocketManagerService,
    private _notifications: NotificationsService,
    private _socket: Socket
  ) {
    this.init();
  }

  private init(): void {
    this._store.select(UserProfileState.selectStateData).pipe(takeUntil(this._unsubscribeAll)).subscribe((profile: any) => {
      if (!this._authService.authenticated || !profile) {
        return;
      }
      this.handleProfile(profile);
    });

    try {
      (this._socket.ioSocket as any)?.on('ready', () => {
        this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('syncing', 0, 'Synchronisation des contacts en cours...'));
        this.showSyncProgress('Synchronisation WhatsApp en cours', 0);
      });

      (this._socket.ioSocket as any)?.on('sync-progress', (value: any) => {
        const percent = value?.percent ?? 0;
        this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('syncing', percent, 'Synchronisation des contacts...'));
        this.showSyncProgress('Synchronisation WhatsApp', percent);
      });

      (this._socket.ioSocket as any)?.on('info', () => {
        this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('ready', 100, null));
        this._store.dispatch(new GlobalAction.ChangeWhatsAppConnectedStatus(true));
        this.hideSyncProgress('Synchronisation WhatsApp terminée');
        this.clearNotSyncedNotification();
      });

      (this._socket.ioSocket as any)?.on('sync-connected', () => {
        this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('syncing', 0, 'WhatsApp connecté, chargement des contacts...'));
        this.showSyncProgress('Chargement des contacts WhatsApp', 0);
      });

      (this._socket.ioSocket as any)?.on('disconnected', () => {
        this._hasAutoStarted = false;
        this.clearSyncProgress();
        this._store.dispatch(new GlobalAction.ChangeWhatsAppConnectedStatus(false));
        this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('not_synced', 0, 'WhatsApp déconnecté'));
      });

      (this._socket.ioSocket as any)?.on('sync-error', (err: any) => {
        this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('error', 0, err?.message || 'Erreur de synchronisation'));
        this.clearSyncProgress();
        this._toastr.error(err?.message || 'Erreur lors de la synchronisation WhatsApp', 'Erreur');
      });
    } catch (e) {
      // ignore
    }
  }

  private handleProfile(profile: any): void {
    const hasSync = !!profile?.hasSyncWhatsApp;
    if (hasSync) {
      this.clearNotSyncedNotification();
      if (!this._hasAutoStarted) {
        this._hasAutoStarted = true;
        this.autoStartSync();
      }
    } else {
      this._hasAutoStarted = false;
      this.showNotSyncedBlocking();
      this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('not_synced', 0, 'WhatsApp non synchronisé'));
    }
  }

  private autoStartSync(): void {
    this._store.dispatch(new GlobalAction.SetWhatsAppSyncStatus('connecting', 0, 'Connexion à WhatsApp...'));
    const user = this._authService.user;
    if (user) {
      try {
        this._wsManager.customConnexion(user);
      } catch (e) {
        // ignore
      }
    }
    setTimeout(() => {
      try {
        this._syncQr.startSync();
      } catch (e) {
        // ignore
      }
    }, 500);
    this.showSyncProgress('Initialisation de la synchronisation WhatsApp', 0);
  }

  private showNotSyncedBlocking(): void {
    if (this._notSyncedNotificationId) {
      return;
    }
    try {
      this._notifications.create({
        icon: 'heroicons_outline:exclamation-triangle',
        title: 'WhatsApp non synchronisé',
        description: 'Vous devez synchroniser votre compte WhatsApp pour envoyer des messages.',
        link: '/sync_whatsapp',
        useRouter: true
      }).subscribe((n: any) => {
        if (n?.id) {
          this._notSyncedNotificationId = n.id;
        }
      });
    } catch (e) {
      // ignore
    }
    try {
      this._toastr.warning("Synchronisez votre compte WhatsApp pour activer l'envoi de messages", 'Action requise', {
        timeOut: 0,
        extendedTimeOut: 0,
        closeButton: true
      });
    } catch (e) {
      // ignore
    }
  }

  private clearNotSyncedNotification(): void {
    const id = this._notSyncedNotificationId;
    this._notSyncedNotificationId = null;
    if (id) {
      try {
        this._notifications.delete(id).subscribe();
      } catch (e) {
        // ignore
      }
    }
  }

  private showSyncProgress(title: string, percent: number): void {
    const rounded = Math.max(0, Math.min(100, Math.round(percent)));
    if (this._syncProgressToast && rounded === this._lastProgressPercent) {
      return;
    }
    this.clearSyncProgress();
    try {
      this._syncProgressToast = this._toastr.info(`Synchronisation : ${rounded}%`, title, {
        timeOut: 0,
        extendedTimeOut: 0,
        progressBar: true,
        closeButton: true
      });
      this._lastProgressPercent = rounded;
    } catch (e) {
      // ignore
    }
  }

  private clearSyncProgress(): void {
    if (this._syncProgressToast) {
      try {
        this._toastr.clear(this._syncProgressToast.toastId);
      } catch (e) {
        // ignore
      }
      this._syncProgressToast = null;
    }
    this._lastProgressPercent = -1;
  }

  private hideSyncProgress(message: string): void {
    this.clearSyncProgress();
    try {
      this._toastr.success(message, 'WhatsApp');
    } catch (e) {
      // ignore
    }
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next(null);
    this._unsubscribeAll.complete();
  }
}
