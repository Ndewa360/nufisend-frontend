import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-api-keys',
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      <div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent">
        <div class="flex-1 min-w-0">
          <div class="text-2xl md:text-3xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate">API NufiSend</div>
          <div class="flex items-center mt-2">
            <div class="ml-1.5 leading-6 truncate text-secondary">Générez vos clés API pour intégrer NufiSend à vos propres outils</div>
          </div>
        </div>
        <div class="flex shrink-0 items-center mt-6 sm:mt-0 sm:ml-4">
          <button mat-flat-button [color]="'primary'" (click)="generateKey()">
            <mat-icon [svgIcon]="'heroicons_outline:plus'"></mat-icon>
            <span class="ml-2">Générer une clé API</span>
          </button>
        </div>
      </div>

      <div class="flex-auto p-6 sm:p-10">
        <div class="max-w-6xl mx-auto">
          <mat-card class="mb-6">
            <mat-card-header>
              <mat-card-title>Configuration & Documentation API</mat-card-title>
            </mat-card-header>
            <mat-card-content class="mt-4">
              <p class="mb-4">Base URL: <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{{apiBaseUrl}}/v1</code></p>
              <p class="mb-4">Documentation Swagger complète: <a [href]="apiBaseUrl + '/api-docs'" target="_blank" class="text-primary-500 hover:underline">{{apiBaseUrl}}/api-docs</a></p>
              <p class="mb-4">Authentification: <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Header X-API-Key: votre_clé_api</code> ou <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">Authorization: Bearer votre_clé_api</code></p>
              <p class="mb-2"><strong>Endpoints disponibles:</strong></p>
              <ul class="list-disc pl-6 space-y-2">
                <li><code>GET /v1/me</code> - Informations utilisateur</li>
                <li><code>GET /v1/messages/planned</code> - Messages programmés</li>
                <li><code>POST /v1/messages/send</code> - Envoyer un message (immédiat ou planifié)</li>
                <li><code>POST /v1/messages/send-bulk</code> - Envoi en masse direct</li>
                <li><code>GET /v1/contacts</code> - Liste des contacts</li>
                <li><code>GET /v1/groups</code> - Liste des groupes</li>
              </ul>
              <p class="mt-4 text-sm text-secondary">Pour la documentation complète et interactive, consultez Swagger à l'adresse ci-dessus.</p>
            </mat-card-content>
          </mat-card>

          <mat-card>
            <mat-card-header>
              <mat-card-title>Mes clés API</mat-card-title>
              <mat-card-subtitle>Gérez vos clés pour intégrer NufiSend à vos outils</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="overflow-x-auto mt-4">
                <table mat-table [dataSource]="apiKeys" class="w-full">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Nom</th>
                    <td mat-cell *matCellDef="let key">{{key.name}}</td>
                  </ng-container>

                  <ng-container matColumnDef="key">
                    <th mat-header-cell *matHeaderCellDef>Clé</th>
                    <td mat-cell *matCellDef="let key"><code>{{key.keyPreview}}</code></td>
                  </ng-container>

                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef>Créée le</th>
                    <td mat-cell *matCellDef="let key">{{key.createdAt | date:'medium'}}</td>
                  </ng-container>

                  <ng-container matColumnDef="lastUsedAt">
                    <th mat-header-cell *matHeaderCellDef>Dernière utilisation</th>
                    <td mat-cell *matCellDef="let key">{{key.lastUsedAt ? (key.lastUsedAt | date:'medium') : 'Jamais'}}</td>
                  </ng-container>

                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let key">
                      <mat-chip [color]="key.isActive ? 'accent' : 'warn'">{{key.isActive ? 'Active' : 'Inactive'}}</mat-chip>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let key">
                      <button mat-icon-button color="warn" (click)="revokeKey(key)" matTooltip="Révoquer">
                        <mat-icon>delete</mat-icon>
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
export class ApiKeysComponent implements OnInit {
  apiKeys: any[] = [];
  displayedColumns = ['name', 'key', 'createdAt', 'lastUsedAt', 'status', 'actions'];
  apiBaseUrl = environment.apiUrl;

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngOnInit() {
    this.loadKeys();
  }

  loadKeys() {
    this.http.get<any>(`${environment.apiUrl}/api/keys`).subscribe({
      next: (res) => {
        if (res.data) this.apiKeys = res.data;
      }
    });
  }

  generateKey() {
    const name = prompt('Nom de la clé API:', 'Ma clé API');
    if (!name) return;
    this.http.post<any>(`${environment.apiUrl}/api/keys/generate`, { name }).subscribe({
      next: (res) => {
        if (res.data?.key) {
          alert('Clé API générée avec succès:\n\n' + res.data.key + '\n\nIMPORTANT: Conservez-la en lieu sûr, elle ne sera plus affichée intégralement.');
        }
        this.snackBar.open(res.message || 'Clé API générée', 'OK', { duration: 3000 });
        this.loadKeys();
      }
    });
  }

  revokeKey(key: any) {
    if (!confirm('Êtes-vous sûr de vouloir révoquer cette clé API ? Cette action est irréversible.')) return;
    this.http.delete<any>(`${environment.apiUrl}/api/keys/${key._id}`).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || 'Clé révoquée', 'OK', { duration: 3000 });
        this.loadKeys();
      }
    });
  }
}
