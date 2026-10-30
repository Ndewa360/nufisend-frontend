import { Component, OnInit, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Clipboard } from '@angular/cdk/clipboard';

// ── Dialog: générer une clé ──────────────────────────────────────────────────
@Component({
  selector: 'app-generate-key-dialog',
  template: `
    <h2 mat-dialog-title>Générer une clé API</h2>
    <mat-dialog-content>
      <form [formGroup]="form" class="flex flex-col gap-4 mt-2">
        <mat-form-field appearance="outline" class="w-full">
          <mat-label>Nom de la clé</mat-label>
          <input matInput formControlName="name" placeholder="Ex: Mon application">
          <mat-error *ngIf="form.get('name').hasError('required')">Le nom est requis</mat-error>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="primary" [disabled]="form.invalid" (click)="confirm()">Générer</button>
    </mat-dialog-actions>
  `,
})
export class GenerateKeyDialogComponent {
  form: FormGroup;
  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<GenerateKeyDialogComponent>,
  ) {
    this.form = this.fb.group({ name: ['Ma clé API', Validators.required] });
  }
  confirm() { this.dialogRef.close(this.form.value.name); }
}

// ── Dialog: afficher la clé générée ─────────────────────────────────────────
@Component({
  selector: 'app-show-key-dialog',
  template: `
    <h2 mat-dialog-title>
      <mat-icon class="text-green-500 mr-2" style="vertical-align:middle">check_circle</mat-icon>
      Clé API générée avec succès
    </h2>
    <mat-dialog-content>
      <fuse-alert type="warning" class="mb-4">
        <span fuseAlertTitle>Important</span>
        Conservez cette clé en lieu sûr. Elle ne sera plus affichée intégralement après fermeture.
      </fuse-alert>
      <div class="flex items-center gap-2 mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <code class="flex-1 text-sm break-all">{{data.key}}</code>
        <button mat-icon-button (click)="copy()" matTooltip="Copier">
          <mat-icon>{{copied ? 'check' : 'content_copy'}}</mat-icon>
        </button>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>J'ai sauvegardé ma clé</button>
    </mat-dialog-actions>
  `,
})
export class ShowKeyDialogComponent {
  copied = false;
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { key: string },
    private clipboard: Clipboard,
  ) {}
  copy() {
    this.clipboard.copy(this.data.key);
    this.copied = true;
    setTimeout(() => this.copied = false, 2000);
  }
}

// ── Dialog: confirmer révocation ─────────────────────────────────────────────
@Component({
  selector: 'app-confirm-revoke-dialog',
  template: `
    <h2 mat-dialog-title>Révoquer la clé API</h2>
    <mat-dialog-content>
      <p>Êtes-vous sûr de vouloir révoquer la clé <strong>{{data.name}}</strong> ?</p>
      <p class="text-warn mt-2 text-sm">Cette action est irréversible. Toutes les intégrations utilisant cette clé cesseront de fonctionner.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Révoquer</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmRevokeDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { name: string }) {}
}

// ── Composant principal ───────────────────────────────────────────────────────
@Component({
  selector: 'app-api-keys',
  template: `
    <div class="flex flex-col flex-auto min-w-0">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:py-8 sm:px-10 border-b bg-card dark:bg-transparent">
        <div class="flex-1 min-w-0">
          <div class="text-2xl md:text-3xl font-extrabold tracking-tight leading-7 sm:leading-10 truncate">API NufiSend</div>
          <div class="flex items-center mt-2">
            <div class="ml-1.5 leading-6 truncate text-secondary">Intégrez NufiSend à vos propres outils via API</div>
          </div>
        </div>
        <div class="flex shrink-0 items-center mt-6 sm:mt-0 sm:ml-4">
          <button mat-flat-button [color]="'primary'" (click)="openGenerateDialog()">
            <mat-icon [svgIcon]="'heroicons_outline:plus'"></mat-icon>
            <span class="ml-2">Générer une clé API</span>
          </button>
        </div>
      </div>

      <div class="flex-auto p-6 sm:p-10">
        <div class="max-w-6xl mx-auto space-y-6">

          <!-- Documentation -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Configuration & Documentation</mat-card-title>
            </mat-card-header>
            <mat-card-content class="mt-4 space-y-3">
              <div class="flex items-center gap-2">
                <span class="text-secondary text-sm w-32">Base URL</span>
                <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm flex-1">{{apiBaseUrl}}/v1</code>
                <button mat-icon-button (click)="copyText(apiBaseUrl + '/v1')" matTooltip="Copier"><mat-icon>content_copy</mat-icon></button>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-secondary text-sm w-32">Swagger</span>
                <a [href]="apiBaseUrl + '/api-docs'" target="_blank" class="text-primary-500 hover:underline text-sm">{{apiBaseUrl}}/api-docs</a>
              </div>
              <div class="flex items-start gap-2">
                <span class="text-secondary text-sm w-32 mt-1">Auth</span>
                <div class="flex flex-col gap-1">
                  <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">X-API-Key: votre_clé</code>
                  <code class="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-sm">Authorization: Bearer votre_clé</code>
                </div>
              </div>
              <div class="mt-4">
                <p class="font-medium text-sm mb-2">Endpoints disponibles :</p>
                <ul class="list-disc pl-6 space-y-1 text-sm text-secondary">
                  <li><code>GET /v1/me</code> — Informations utilisateur</li>
                  <li><code>GET /v1/messages/planned</code> — Messages programmés</li>
                  <li><code>POST /v1/messages/send</code> — Envoyer un message</li>
                  <li>
                    <code>GET /v1/messages/send</code> — Envoyer un message par URL (environnements limités aux requêtes GET)
                    <div class="mt-1 text-xs break-all"><code>/v1/messages/send?apiKey=VOTRE_CLE&amp;contacts=ID1,ID2&amp;text=Bonjour&amp;idempotencyKey=cmd-123</code></div>
                    <div class="text-xs">Encodez chaque valeur ; une clé dans l'URL peut apparaître dans les journaux : utilisez une clé dédiée et <code>idempotencyKey</code> contre les doubles envois.</div>
                  </li>
                  <li><code>POST /v1/messages/send-bulk</code> — Envoi en masse</li>
                  <li><code>GET /v1/contacts</code> — Liste des contacts</li>
                  <li><code>GET /v1/groups</code> — Liste des groupes</li>
                </ul>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Table des clés -->
          <mat-card>
            <mat-card-header>
              <mat-card-title>Mes clés API</mat-card-title>
              <mat-card-subtitle>{{apiKeys.length}} clé(s) configurée(s)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div *ngIf="apiKeys.length === 0" class="flex flex-col items-center justify-center py-12 text-secondary">
                <mat-icon class="icon-size-12 mb-4">vpn_key</mat-icon>
                <p>Aucune clé API. Générez-en une pour commencer.</p>
              </div>
              <div *ngIf="apiKeys.length > 0" class="overflow-x-auto mt-4">
                <table mat-table [dataSource]="apiKeys" class="w-full">
                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Nom</th>
                    <td mat-cell *matCellDef="let key">{{key.name}}</td>
                  </ng-container>
                  <ng-container matColumnDef="key">
                    <th mat-header-cell *matHeaderCellDef>Clé</th>
                    <td mat-cell *matCellDef="let key">
                      <code class="text-xs">{{key.keyPreview}}</code>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="createdAt">
                    <th mat-header-cell *matHeaderCellDef>Créée le</th>
                    <td mat-cell *matCellDef="let key">{{key.createdAt | date:'dd/MM/yyyy'}}</td>
                  </ng-container>
                  <ng-container matColumnDef="lastUsedAt">
                    <th mat-header-cell *matHeaderCellDef>Dernière utilisation</th>
                    <td mat-cell *matCellDef="let key">{{key.lastUsedAt ? (key.lastUsedAt | date:'dd/MM/yyyy HH:mm') : '—'}}</td>
                  </ng-container>
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef>Statut</th>
                    <td mat-cell *matCellDef="let key">
                      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                        [class.bg-green-100]="key.isActive" [class.text-green-800]="key.isActive"
                        [class.bg-red-100]="!key.isActive" [class.text-red-800]="!key.isActive">
                        {{key.isActive ? 'Active' : 'Inactive'}}
                      </span>
                    </td>
                  </ng-container>
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let key">
                      <button mat-icon-button color="warn" (click)="openRevokeDialog(key)" matTooltip="Révoquer">
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
  `,
})
export class ApiKeysComponent implements OnInit {
  apiKeys: any[] = [];
  displayedColumns = ['name', 'key', 'createdAt', 'lastUsedAt', 'status', 'actions'];
  apiBaseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private clipboard: Clipboard,
  ) {}

  ngOnInit() { this.loadKeys(); }

  loadKeys() {
    this.http.get<any>(`${environment.apiUrl}/api/keys`).subscribe({
      next: (res) => { if (res.data) this.apiKeys = res.data; },
    });
  }

  openGenerateDialog() {
    this.dialog.open(GenerateKeyDialogComponent, { width: '420px' })
      .afterClosed().subscribe((name: string) => {
        if (!name) return;
        this.http.post<any>(`${environment.apiUrl}/api/keys/generate`, { name }).subscribe({
          next: (res) => {
            if (res.data?.key) {
              this.dialog.open(ShowKeyDialogComponent, {
                width: '520px',
                disableClose: true,
                data: { key: res.data.key },
              });
            }
            this.snackBar.open(res.message || 'Clé API générée', 'OK', { duration: 3000 });
            this.loadKeys();
          },
          error: (err) => {
            this.snackBar.open(err?.error?.message || 'Erreur lors de la génération', 'OK', { duration: 4000 });
          },
        });
      });
  }

  openRevokeDialog(key: any) {
    this.dialog.open(ConfirmRevokeDialogComponent, {
      width: '420px',
      data: { name: key.name },
    }).afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) return;
      this.http.delete<any>(`${environment.apiUrl}/api/keys/${key._id}`).subscribe({
        next: (res) => {
          this.snackBar.open(res.message || 'Clé révoquée', 'OK', { duration: 3000 });
          this.loadKeys();
        },
        error: (err) => {
          this.snackBar.open(err?.error?.message || 'Erreur lors de la révocation', 'OK', { duration: 4000 });
        },
      });
    });
  }

  copyText(text: string) {
    this.clipboard.copy(text);
    this.snackBar.open('Copié !', '', { duration: 1500 });
  }
}
