import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { XafPipe } from 'app/shared/pipes/xaf.pipe';
import { ReceiptComponent } from './receipt/receipt.component';
import { TopupDialogComponent } from './topup-dialog/topup-dialog.component';
import { WalletComponent } from './wallet.component';

const routes: Routes = [
    { path: '', component: WalletComponent },
    { path: 'receipt/:reference', component: ReceiptComponent },
];

@NgModule({
    declarations: [WalletComponent, TopupDialogComponent, ReceiptComponent],
    imports     : [SharedModule, XafPipe, RouterModule.forChild(routes)],
})
export class WalletModule
{
}
