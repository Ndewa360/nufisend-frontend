import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { Select } from '@ngxs/store';
import { SyncQrcodeService } from 'app/shared/services/whatsapp/sync-qrcode.service';
import { GlobalState, WhatsappContactState, WhatsappQrCodeState } from 'app/shared/store';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Observable, Subject, takeUntil } from 'rxjs';
import { debugLog } from 'app/shared/utils/debug-log';

@Component({
  selector: 'app-qrcode-synchro-statut',
  templateUrl: './qrcode-synchro-statut.component.html',
  styleUrls: ['./qrcode-synchro-statut.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation  : ViewEncapsulation.None,
})
export class QrcodeSynchroStatutComponent implements OnInit, OnDestroy {

  constructor(
    private syncQrCodeService:SyncQrcodeService,
    private _changeDetectorRef: ChangeDetectorRef,
    ){}

  userProfile=null;

  @Select(UserProfileState.selectStateData) userProfile$:Observable<UserProfileModel>
  @Select(UserProfileState.selectStateLoading) loadingUserProfile$:Observable<boolean>
  @Select(WhatsappQrCodeState.selectStateQrCode) whatsappQrCode$:Observable<string>
  @Select(WhatsappQrCodeState.selectStateLoading) whatsappHasLoadQrCode$: Observable<boolean>
  @Select(WhatsappContactState.selectStatePercent) syncPercent$:Observable<number>
  @Select(WhatsappContactState.selectStateSyncError) syncError$:Observable<string>
  @Select(GlobalState.isWhatsAppReady) isWhatsAppReady$:Observable<boolean>
  @Select(GlobalState.selectWhatsAppSyncStatus) whatsappSync$:Observable<{status:string, progress:number, message:string}>

  generatedQrCode:string=""
  isWaitingWhatsappSync:boolean = false;
  hasQrCodeIsGenerated = false;
  waitingForUnsync = false;

  private _unsubscribeAll: Subject<void> = new Subject<void>();

  ngOnInit(): void {
    this.whatsappQrCode$.pipe(takeUntil(this._unsubscribeAll)).subscribe((data)=>{
      debugLog('[QrStatut] qrCode$ =', data ? 'QR(' + data.length + ')' : data);
      if(!data){
        // A null QR means the flow restarted or the session connected: drop any
        // previously displayed code so it never stays frozen on screen.
        this.generatedQrCode="";
        this.hasQrCodeIsGenerated=false;
        this._changeDetectorRef.markForCheck();
        return;
      }
      this.isWaitingWhatsappSync=false;
      this.hasQrCodeIsGenerated=true;
      this.generatedQrCode=data;
      // Mark for check
      this._changeDetectorRef.markForCheck();
    })
    this.userProfile$.pipe(takeUntil(this._unsubscribeAll)).subscribe((value)=> {
      debugLog('[QrStatut] userProfile$ hasSyncWhatsApp=', value?.hasSyncWhatsApp);
      this.userProfile= value
      // Once the profile reports the session as connected, hide the QR code
      // regardless of the local QR flags (auth can succeed before the profile
      // store is updated, and vice versa).
      if(value?.hasSyncWhatsApp){
        this.hasQrCodeIsGenerated=false;
        this.generatedQrCode="";
        this.isWaitingWhatsappSync=true;
      } else {
        this.isWaitingWhatsappSync=false;
      }
      this._changeDetectorRef.markForCheck();
    })

    this.whatsappHasLoadQrCode$.pipe(takeUntil(this._unsubscribeAll)).subscribe((loading)=>{
      debugLog('[QrStatut] loadingQrCode$ =', loading);
      if (this.userProfile?.hasSyncWhatsApp) {
        this.isWaitingWhatsappSync = !!loading;
      } else if (this.hasQrCodeIsGenerated) {
        // Keep QR visible while waiting; don't override QR display with loader
        this.isWaitingWhatsappSync = false;
      } else {
        this.isWaitingWhatsappSync = !!loading;
      }
      this._changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this._unsubscribeAll.next();
    this._unsubscribeAll.complete();
  }

  startWathappSync()
  {
    this.isWaitingWhatsappSync=true;
    this.hasQrCodeIsGenerated=false;
    this.generatedQrCode="";
    this.syncQrCodeService.startSync();
  }

  endWhatsappSync()
  {
    this.hasQrCodeIsGenerated = false;
    this.generatedQrCode="";
    this.syncQrCodeService.unSubscribeToQrCode(this.userProfile?.email)
  }
}
