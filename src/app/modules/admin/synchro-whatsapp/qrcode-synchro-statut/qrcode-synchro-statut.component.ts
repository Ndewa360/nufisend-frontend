import { ChangeDetectionStrategy, ChangeDetectorRef, Component,OnInit, ViewEncapsulation } from '@angular/core';
import { Select } from '@ngxs/store';
import { SyncQrcodeService } from 'app/shared/services/whatsapp/sync-qrcode.service';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-qrcode-synchro-statut',
  templateUrl: './qrcode-synchro-statut.component.html',
  styleUrls: ['./qrcode-synchro-statut.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation  : ViewEncapsulation.None,
})
export class QrcodeSynchroStatutComponent implements OnInit {

  constructor(
    private syncQrCodeService:SyncQrcodeService,
    private _changeDetectorRef: ChangeDetectorRef,
    ){}

  userProfile=null;
  
  @Select(UserProfileState.selectStateData) userProfile$:Observable<UserProfileModel>
  @Select(UserProfileState.selectStateLoading) loadingUserProfile$:Observable<boolean>
  
  generatedQrCode:string=""
  isWaitingWhatsappSync = false;
  hasQrCodeIsGenerated = false;
  waitingForUnsync = false;

  ngOnInit(): void {
    this.syncQrCodeService.qrCode.subscribe((data)=>{
      if(!data) return;
      this.isWaitingWhatsappSync=false;
      this.hasQrCodeIsGenerated=true;
      this.generatedQrCode=data;
      // Mark for check
      this._changeDetectorRef.markForCheck();
    })
    this.userProfile$.subscribe((value)=> {
      this.userProfile= value
    })
  }

  startWathappSync()
  {
    this.isWaitingWhatsappSync=true;
    this.syncQrCodeService.subscribeToQrCode();
  }

  endWhatsappSync()
  {
    this.hasQrCodeIsGenerated = false;
    this.syncQrCodeService.unSubscribeToQrCode(this.userProfile.email)
  }
}
