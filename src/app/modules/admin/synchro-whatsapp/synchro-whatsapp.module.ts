import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SynchroWhatsappRoutingModule } from './synchro-whatsapp-routing.module';
import { HomeComponent } from './home/home.component';
import { SharedModule } from 'app/shared/shared.module';
import { QrcodeSynchroStatutComponent } from './qrcode-synchro-statut/qrcode-synchro-statut.component';
import { QRCodeModule } from 'angularx-qrcode';
import { ProfileComponent } from './profile/profile.component';
import { ContactComponent } from './contact/contact.component';

@NgModule({
  declarations: [
    HomeComponent,
    QrcodeSynchroStatutComponent,
    ProfileComponent,
    ContactComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    SynchroWhatsappRoutingModule,
    QRCodeModule
  ]
})
export class SynchroWhatsappModule { }
