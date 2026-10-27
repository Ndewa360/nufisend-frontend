import { Component, OnDestroy, OnInit } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from 'environments/environment';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

interface AdminUser {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isBlocked: boolean;
  emailConfirmed: boolean;
}

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
        <mat-card>
          <mat-card-header>
            <mat-card-title>Liste des comptes utilisateurs</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="flex flex-col sm:flex-row gap-4 mt-4">
              <mat-form-field class="flex-auto fuse-mat-dense" subscriptSizing="dynamic">
                <mat-icon matPrefix [svgIcon]="'heroicons_outline:search'"></mat-icon>
                <input matInput placeholder="Rechercher (email, nom)" [ngModel]="search" (ngModelChange)="onSearch($event)">
              </mat-form-field>
              <mat-form-field class="sm:w-48 fuse-mat-dense" subscriptSizing="dynamic">
                <mat-select [(ngModel)]="status" (selectionChange)="reload(true)">
                  <mat-option value="">Tous</mat-option>
                  <mat-option value="active">Actifs</mat-option>
                  <mat-option value="blocked">Bloqués</mat-option>
                </mat-select>
              </mat-form-field>
            </div>

            <mat-progress-bar *ngIf="loading" mode="indeterminate" class="mt-4"></mat-progress-bar>

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
                    <mat-chip [color]="isAdmin(user) ? 'primary' : ''">{{isAdmin(user) ? 'ADMIN' : 'USER'}}</mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Statut</th>
                  <td mat-cell *matCellDef="let user">
                    <mat-chip [color]="user.isBlocked ? 'warn' : 'accent'">{{user.isBlocked ? 'Bloqué' : 'Actif'}}</mat-chip>
                  </td>
                </ng-container>

                <ng-container matColumnDef="confirmed">
                  <th mat-header-cell *matHeaderCellDef>Email confirmé</th>
                  <td mat-cell *matCellDef="let user">{{user.emailConfirmed ? 'Oui' : 'Non'}}</td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let user">
                    <button mat-icon-button matTooltip="Détails" [routerLink]="['/super-admin/users', user._id]">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <ng-container *ngIf="canModerate(user)">
                      <button mat-icon-button matTooltip="Bloquer" *ngIf="!user.isBlocked" (click)="blockUser(user)">
                        <mat-icon color="warn">block</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Débloquer" *ngIf="user.isBlocked" (click)="unblockUser(user)">
                        <mat-icon color="accent">check_circle</mat-icon>
                      </button>
                      <button mat-icon-button matTooltip="Supprimer" (click)="deleteUser(user)">
                        <mat-icon color="warn">delete</mat-icon>
                      </button>
                    </ng-container>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
              <div *ngIf="!loading && users.length === 0" class="p-6 text-center text-secondary">Aucun utilisateur trouvé</div>
            </div>

            <mat-paginator
              [length]="total"
              [pageIndex]="pageIndex"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 20, 50, 100]"
              (page)="onPage($event)"
              aria-label="Pagination des utilisateurs">
            </mat-paginator>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `
})
export class UsersListComponent implements OnInit, OnDestroy {
  users: AdminUser[] = [];
  displayedColumns = ['email', 'name', 'role', 'status', 'confirmed', 'actions'];
  total = 0;
  pageIndex = 0;
  pageSize = 20;
  search = '';
  status = '';
  loading = false;

  private readonly _search$ = new Subject<string>();
  private readonly _destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private confirmation: FuseConfirmationService,
  ) {}

  ngOnInit(): void {
    this._search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this._destroy$))
      .subscribe((value) => {
        this.search = value;
        this.reload(true);
      });
    this.reload();
  }

  ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  isAdmin(user: AdminUser): boolean {
    return user.role === 'ADMIN';
  }

  /** Les administrateurs (et soi-même) ne peuvent pas être bloqués ni supprimés. */
  canModerate(user: AdminUser): boolean {
    return !this.isAdmin(user) && user._id !== this.authService.user?._id;
  }

  onSearch(value: string): void {
    this._search$.next(value.trim());
  }

  onPage(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.reload();
  }

  reload(resetPage = false): void {
    if (resetPage) this.pageIndex = 0;
    this.loading = true;
    let params = new HttpParams()
      .set('page', String(this.pageIndex + 1))
      .set('limit', String(this.pageSize));
    if (this.search) params = params.set('search', this.search);
    if (this.status) params = params.set('status', this.status);

    this.http.get<any>(`${environment.apiUrl}/admin/users`, { params }).subscribe({
      next: (res) => {
        this.users = res.data?.users || [];
        this.total = res.data?.total || 0;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.notifyError(error);
      },
    });
  }

  blockUser(user: AdminUser): void {
    const reason = prompt(`Raison du blocage de ${user.email} :`);
    if (reason === null) return;
    this.http.post<any>(`${environment.apiUrl}/admin/users/${user._id}/block`, { reason }).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Utilisateur bloqué', 'OK', { duration: 3000 });
        this.reload();
      },
      error: (error) => this.notifyError(error),
    });
  }

  unblockUser(user: AdminUser): void {
    this.http.post<any>(`${environment.apiUrl}/admin/users/${user._id}/unblock`, {}).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Utilisateur débloqué', 'OK', { duration: 3000 });
        this.reload();
      },
      error: (error) => this.notifyError(error),
    });
  }

  deleteUser(user: AdminUser): void {
    this.confirmation
      .open({
        title: 'Supprimer le compte',
        message: `Supprimer le compte ${user.email} ? L'utilisateur sera immédiatement déconnecté.`,
        actions: { confirm: { label: 'Supprimer' }, cancel: { label: 'Annuler' } },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result !== 'confirmed') return;
        this.http.delete<any>(`${environment.apiUrl}/admin/users/${user._id}`).subscribe({
          next: (res) => {
            this.snackBar.open(res.message || 'Utilisateur supprimé', 'OK', { duration: 3000 });
            this.reload();
          },
          error: (error) => this.notifyError(error),
        });
      });
  }

  private notifyError(error: HttpErrorResponse): void {
    const message = error?.error?.message;
    this.snackBar.open(
      Array.isArray(message) ? message.join(', ') : message || 'Une erreur est survenue',
      'OK',
      { duration: 5000 },
    );
  }
}
