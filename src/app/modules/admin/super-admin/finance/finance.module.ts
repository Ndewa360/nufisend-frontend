import { NgModule } from '@angular/core';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule, Routes } from '@angular/router';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SharedModule } from 'app/shared/shared.module';
import { XafPipe } from 'app/shared/pipes/xaf.pipe';
import { FinanceAuditComponent, FinanceComponent } from './finance.component';
import { FinanceLedgerComponent } from './ledger/finance-ledger.component';
import { FinanceOverviewComponent } from './overview/finance-overview.component';
import { FinancePaymentsComponent, PaymentDetailDialogComponent } from './payments/finance-payments.component';
import { FinanceReconciliationComponent } from './reconciliation/finance-reconciliation.component';
import { FinanceSettingsComponent } from './settings/finance-settings.component';
import { FinanceWalletsComponent, WalletDetailDialogComponent } from './wallets/finance-wallets.component';

const routes: Routes = [{ path: '', component: FinanceComponent }];

@NgModule({
    declarations: [
        FinanceComponent,
        FinanceOverviewComponent,
        FinancePaymentsComponent,
        PaymentDetailDialogComponent,
        FinanceWalletsComponent,
        WalletDetailDialogComponent,
        FinanceLedgerComponent,
        FinanceReconciliationComponent,
        FinanceSettingsComponent,
        FinanceAuditComponent,
    ],
    imports     : [SharedModule, XafPipe, NgApexchartsModule, MatSnackBarModule, RouterModule.forChild(routes)],
})
export class FinanceModule
{
}
