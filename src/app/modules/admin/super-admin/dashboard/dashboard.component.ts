import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-super-admin-dashboard',
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      <div class="bg-card">
        <div class="flex flex-col w-full max-w-screen-xl mx-auto px-6 sm:px-8">
          <div class="flex flex-col sm:flex-row flex-auto sm:items-center min-w-0 my-8 sm:my-12">
            <div class="flex flex-auto items-center min-w-0">
              <div class="flex flex-col min-w-0 ml-4">
                <div class="text-2xl md:text-5xl font-semibold tracking-tight leading-7 md:leading-snug truncate">Administration NufiSend</div>
                <div class="flex items-center">
                  <div class="ml-1.5 leading-6 truncate text-secondary">Super Administration - Accès réservé à l'administrateur</div>
                </div>
              </div>
            </div>
            <div class="flex items-center mt-6 sm:mt-0 sm:ml-2 space-x-3">
              <button mat-flat-button [color]="'accent'" [routerLink]="['/super-admin/finance']">
                <mat-icon [svgIcon]="'heroicons_outline:currency-dollar'"></mat-icon>
                <span class="ml-2">Finance</span>
              </button>
              <button mat-flat-button [color]="'primary'" [routerLink]="['/super-admin/users']">
                <mat-icon [svgIcon]="'heroicons_outline:users'"></mat-icon>
                <span class="ml-2">Gérer les utilisateurs</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="flex-auto border-t -mt-px pt-4 sm:pt-6">
        <div class="w-full max-w-screen-xl mx-auto">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full min-w-0">
            <div class="flex flex-col flex-auto p-6 bg-card shadow rounded-2xl overflow-hidden">
              <div class="flex items-start justify-between">
                <div class="text-lg font-medium tracking-tight leading-6 truncate">Total Utilisateurs</div>
              </div>
              <div class="flex flex-col items-center mt-2">
                <div class="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-blue-500">{{stats.totalUsers}}</div>
                <div class="text-lg font-medium text-blue-600 dark:text-blue-500">Comptes</div>
              </div>
            </div>

            <div class="flex flex-col flex-auto p-6 bg-card shadow rounded-2xl overflow-hidden">
              <div class="flex items-start justify-between">
                <div class="text-lg font-medium tracking-tight leading-6 truncate">Actifs</div>
              </div>
              <div class="flex flex-col items-center mt-2">
                <div class="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-green-500">{{stats.activeUsers}}</div>
                <div class="text-lg font-medium text-green-600 dark:text-green-500">Utilisateurs</div>
              </div>
            </div>

            <div class="flex flex-col flex-auto p-6 bg-card shadow rounded-2xl overflow-hidden">
              <div class="flex items-start justify-between">
                <div class="text-lg font-medium tracking-tight leading-6 truncate">Bloqués</div>
              </div>
              <div class="flex flex-col items-center mt-2">
                <div class="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-red-500">{{stats.blockedUsers}}</div>
                <div class="text-lg font-medium text-red-600 dark:text-red-500">Comptes</div>
              </div>
            </div>

            <div class="flex flex-col flex-auto p-6 bg-card shadow rounded-2xl overflow-hidden">
              <div class="flex items-start justify-between">
                <div class="text-lg font-medium tracking-tight leading-6 truncate">Confirmés</div>
              </div>
              <div class="flex flex-col items-center mt-2">
                <div class="text-7xl sm:text-8xl font-bold tracking-tight leading-none text-amber-500">{{stats.confirmedUsers}}</div>
                <div class="text-lg font-medium text-amber-600 dark:text-amber-500">Emails vérifiés</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  stats = { totalUsers: 0, activeUsers: 0, blockedUsers: 0, confirmedUsers: 0 };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get<any>(`${environment.apiUrl}/admin/dashboard/stats`).subscribe({
      next: (res) => {
        if (res.data) this.stats = res.data;
      }
    });
  }
}
