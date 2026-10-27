import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';

@Component({
  selector: 'app-user-details',
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      <div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent">
        <div class="flex-1 min-w-0">
          <div class="text-2xl md:text-3xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate">Détails de l'utilisateur</div>
        </div>
        <div class="flex shrink-0 items-center mt-6 sm:mt-0 sm:ml-4">
          <button mat-flat-button [color]="'primary'" [routerLink]="['/super-admin/users']">
            <mat-icon [svgIcon]="'heroicons_outline:arrow-left'"></mat-icon>
            <span class="ml-2">Retour à la liste</span>
          </button>
        </div>
      </div>

      <div class="flex-auto p-6 sm:p-10">
        <div class="max-w-4xl mx-auto">
          <mat-card class="mb-6">
            <mat-card-header>
              <mat-card-title>Informations du compte</mat-card-title>
            </mat-card-header>
            <mat-card-content class="mt-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><strong>Email:</strong> {{user.email}}</div>
                <div><strong>Prénom:</strong> {{user.firstName}}</div>
                <div><strong>Nom:</strong> {{user.lastName}}</div>
                <div><strong>Téléphone:</strong> {{user.phoneNumber || 'N/A'}}</div>
                <div><strong>Pays:</strong> {{user.country || 'N/A'}}</div>
                <div><strong>Localisation:</strong> {{user.location || 'N/A'}}</div>
                <div><strong>Rôle:</strong> {{user.role || 'USER'}}</div>
                <div><strong>Statut:</strong> {{user.isBlocked ? 'Bloqué' : 'Actif'}}</div>
                <div><strong>Email confirmé:</strong> {{user.emailConfirmed ? 'Oui' : 'Non'}}</div>
                <div><strong>WhatsApp synchronisé:</strong> {{user.hasSyncWhatsApp ? 'Oui' : 'Non'}}</div>
                <div><strong>Contacts:</strong> {{user.contactsCount ?? 0}}</div>
                <div><strong>Groupes:</strong> {{user.groupsCount ?? 0}}</div>
                <div><strong>Date création:</strong> {{user.createdAt | date:'medium'}}</div>
                <div><strong>Bloqué le:</strong> {{user.blockedAt ? (user.blockedAt | date:'medium') : 'N/A'}}</div>
              </div>
              <div class="mt-4" *ngIf="user.blockedReason">
                <strong>Raison du blocage:</strong> {{user.blockedReason}}
              </div>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `
})
export class UserDetailsComponent implements OnInit {
  user: any = {};

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.http.get<any>(`${environment.apiUrl}/admin/users/${id}`).subscribe({
      next: (res) => {
        if (res.data) this.user = res.data;
      }
    });
  }
}
