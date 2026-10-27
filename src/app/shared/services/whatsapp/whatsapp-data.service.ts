import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { WhatsappContactModel, WhatsappContactAction, GlobalAction } from 'app/shared/store';
import { BehaviorSubject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { debugLog } from 'app/shared/utils/debug-log';

const log = (...args: any[]) => debugLog('[WaData]', ...args);

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
    this.socket.on('ready',()=>{
      log('<< RECEIVED ready');
      this.store.dispatch([
        new WhatsappContactAction.SetLoadingState(true),
        // The what's-app Web splash percent is not the contact sync progress:
        // reset it so the determinate bar only reflects the real sync.
        new WhatsappContactAction.SetLoadingPercent(0)
      ])
    })

    // Real contact loading progress computed by the backend while enumerating
    // the WhatsApp contacts (processed/total/percent).
    this.socket.on('sync-progress',(value)=>{
      log('<< RECEIVED sync-progress', value);
      this.store.dispatch(new WhatsappContactAction.SetLoadingPercent(value?.percent ?? 0));
    })

    this.socket.on('info',(value)=>{
      log('<< RECEIVED info contacts=', value?.contacts?.length);
      // Ignore duplicate 'info' events: if contacts are already loaded in the
      // store, a second 'info' (from a reconnect or duplicate 'connexion') must
      // not append to the existing list — SetAllWhatsappContactToLocal replaces,
      // but two rapid dispatches can cause the component to render both updates
      // before Angular's CD collapses them, making the list appear doubled.
      // Connexion automatique sans chargement des contacts : seul l'etat change.
      if (!Array.isArray(value?.contacts)) {
        this.store.dispatch([
          new GlobalAction.ChangeWhatsAppConnectedStatus(true),
          new WhatsappContactAction.SetLoadingState(false)
        ]);
        return;
      }
      const existing = this.store.selectSnapshot((s: any) => s?.whatsapp_contacts?.contacts);
      if (existing && existing.length > 0 && value?.contacts?.length === existing.length) {
        log('info: contacts already loaded (same count), skipping duplicate dispatch');
        return;
      }
      this.store.dispatch([
        new GlobalAction.ChangeWhatsAppConnectedStatus(true),
        new WhatsappContactAction.SetAllWhatsappContactToLocal(value.contacts),
        new WhatsappContactAction.SetLoadingState(false),
        new WhatsappContactAction.SetLoadingPercent(100)
      ]);
    })

    this.socket.on('info-loading-percent',(value)=>{
      // Kept for backward compatibility (what's-app Web boot splash).
      this.store.dispatch(new WhatsappContactAction.SetLoadingPercent(value.percent));
    })

    this.socket.on('sync-error',(value)=>{
      log('<< RECEIVED sync-error', value);
      this.store.dispatch([
        new GlobalAction.ChangeWhatsAppConnectedStatus(false),
        new WhatsappContactAction.SetLoadingState(false),
        new WhatsappContactAction.SetSyncError(value?.message || 'Echec de la synchronisation WhatsApp')
      ]);
    })

    this.socket.on('disconnected',()=>{
      log('<< RECEIVED disconnected');
      this.store.dispatch([
        new GlobalAction.ChangeWhatsAppConnectedStatus(false),
        new WhatsappContactAction.SetLoadingState(false)
      ]);
    })
  }
}
