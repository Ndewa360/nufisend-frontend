import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-users-list',
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      <div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent">
        <div class="flex-1 min-w-0">
          <div class="text-2xl md:text-3xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate">Gestion des Utilisateurs</div>
        </div>
        <div class="flex shrink-0 items-center mt-6 sm:mt-0 sm:ml-4">
          <button mat-flat-button [color]="'primary'" [routerLink]="['/super-admin/dashboard']">
            <mat-icon [svgIcon]="'heroicons_outline:arrow-left'"></mat-icon>
            <span class="ml-2">Retour</span>
          </button>
        </div>
      </div>

      <div class="flex-auto p-6 sm:p-10">
        <div class="max-w-full">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Liste des comptes utilisateurs</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="overflow-x-auto mt-4">
                <table mat-table [dataSource]="users" class="w-full">
                  <ng-container matColumnDef="email">
                    <th mat-header-cell *matHeaderCellDef>Email</th>
                    <td mat-cell *matCellDef="let user">{{user.email}}</td>
                  </ng-container>

                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Nom</th>
                    <td mat-cell *matCellDef="let user">{{user.firstName}} {{user.lastName}}</td>
                  </ng-container>

                  <ng-container matColumnDef="role">
                    <th mat-header-cell *matHeaderCellDef>Rôle</th>
                    <td mat-cell *matCellDef="let user">
                      <mat-chip [color]="user.role === 'ADMIN' || user.email === 'admin@nufisend.ndewa-360.com' ? 'primary' : ''">
                        {{user.role === 'ADMIN' || user.email === 'admin@nufisend.ndewa-360.com' ? 'ADMIN' : 'USER'}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let user">
                      <mat-chip [color]="user.isBlocked ? 'warn' : 'accent'">
                        {{user.isBlocked ? 'Bloqué' : 'Actif'}}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="confirmed">
                    <th mat-header-cell *matHeaderCellDef>Email confirmé</th>
                    <td mat-cell *matCellDef="let user">{{user.emailConfirmed ? 'Oui' : 'Non'}}</td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let user">
                      <button mat-icon-button [routerLink]="['/super-admin/users', user._id]">
                        <mat-icon>visibility</mat-icon>
                      </button>
                      <button mat-icon-button *ngIf="!user.isBlocked && user.email !== 'admin@nufisend.ndewa-360.com'" (click)="blockUser(user)">
                        <mat-icon color="warn">block</mat-icon>
                      </button>
                      <button mat-icon-button *ngIf="user.isBlocked" (click)="unblockUser(user)">
                        <mat-icon color="accent">check_circle</mat-icon>
                      </button>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `
})
export class UsersListComponent implements OnInit {
  users: any[] = [];
  displayedColumns = ['email', 'name', 'role', 'status', 'confirmed', 'actions'];

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.http.get<any>(`${environment.apiUrl}/admin/users`).subscribe({
      next: (res) => {
        if (res.data?.users) this.users = res.data.users;
      }
    });
  }

  blockUser(user: any) {
    const reason = prompt('Raison du blocage:');
    if (reason === null) return;
    this.http.post<any>(`${environment.apiUrl}/admin/users/${user._id}/block`, { reason }).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Utilisateur bloqué', 'OK', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  unblockUser(user: any) {
    this.http.post<any>(`${environment.apiUrl}/admin/users/${user._id}/unblock`, {}).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Utilisateur débloqué', 'OK', { duration: 3000 });
        this.loadUsers();
      }
    });
  }
}
