import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'app/shared/shared.module';
import { SuperAdminGuard } from 'app/core/auth/guards/super-admin.guard';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersListComponent } from './users/users-list.component';
import { UserDetailsComponent } from './users/details/user-details.component';
import { OrganizationsListComponent } from './organizations/organizations-list.component';
import { OrganizationDetailsComponent } from './organizations/organization-details.component';
import { XafPipe } from 'app/shared/pipes/xaf.pipe';
import { PrivacyRequestsComponent } from './privacy/privacy-requests.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';

const routes: Routes = [
  {
    path: '',
    canActivate: [SuperAdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'users', component: UsersListComponent },
      { path: 'users/:id', component: UserDetailsComponent },
      { path: 'organizations', component: OrganizationsListComponent },
      { path: 'organizations/:id', component: OrganizationDetailsComponent },
      { path: 'privacy', component: PrivacyRequestsComponent },
      { path: 'finance', loadChildren: () => import('./finance/finance.module').then((m) => m.FinanceModule) },
    ]
  }
];

@NgModule({
  declarations: [
    DashboardComponent,
    UsersListComponent,
    UserDetailsComponent,
    OrganizationsListComponent,
    OrganizationDetailsComponent,
    PrivacyRequestsComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSelectModule,
    MatTabsModule,
    XafPipe,
  ]
})
export class SuperAdminModule { }
