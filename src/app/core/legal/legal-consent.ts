import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Injectable } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { catchError, of } from 'rxjs';
import { LEGAL_DOCUMENT_PATHS, LegalDocumentId, LegalService } from './legal.service';

/** Nouvelle version des CGU ou de la politique de confidentialite a accepter. */
@Component({
    selector       : 'app-legal-consent-dialog',
    standalone     : true,
    imports        : [CommonModule, FormsModule, RouterModule, MatDialogModule, MatButtonModule, MatCheckboxModule, MatProgressSpinnerModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="p-6 max-w-lg">
            <div class="text-xl font-semibold">Mise à jour de nos conditions</div>
            <p class="mt-3 text-secondary text-sm">
                Nous avons mis à jour les documents suivants. Prenez-en connaissance pour continuer à utiliser NufiSend :
            </p>
            <ul class="mt-3 space-y-1 text-sm">
                <li *ngFor="let d of data.documents">
                    <a class="text-primary underline" [href]="paths[d.document]" target="_blank" rel="noopener">{{ d.title }}</a>
                    <span class="text-secondary"> (version {{ d.version }})</span>
                </li>
            </ul>
            <mat-checkbox class="mt-4" [(ngModel)]="accepted" color="primary">
                J'ai lu et j'accepte ces documents
            </mat-checkbox>
            <p class="text-xs text-secondary mt-2">
                Si vous ne les acceptez pas, vous pouvez télécharger vos données puis supprimer votre compte depuis Paramètres &gt; Confidentialité &amp; données.
            </p>
            <div class="flex justify-end gap-2 mt-6">
                <a mat-button routerLink="/settings/privacy" (click)="close()">Gérer mes données</a>
                <button mat-flat-button color="primary" type="button" [disabled]="!accepted || saving" (click)="accept()">
                    <mat-progress-spinner *ngIf="saving; else label" [diameter]="20" mode="indeterminate"></mat-progress-spinner>
                    <ng-template #label>Accepter et continuer</ng-template>
                </button>
            </div>
        </div>
    `,
})
export class LegalConsentDialogComponent
{
    readonly paths = LEGAL_DOCUMENT_PATHS;
    accepted = false;
    saving = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { documents: { document: LegalDocumentId; title: string; version: string }[] },
        private _dialogRef: MatDialogRef<LegalConsentDialogComponent>,
        private _legalService: LegalService,
        private _cdr: ChangeDetectorRef,
    )
    {
    }

    accept(): void
    {
        this.saving = true;
        this._legalService.accept(this.data.documents.map((d) => d.document)).subscribe({
            next : () => this._dialogRef.close(true),
            error: () => {
                this.saving = false;
                this._cdr.markForCheck();
            },
        });
    }

    close(): void
    {
        this._dialogRef.close(false);
    }
}

/** Verifie, a l'ouverture de l'application, que les documents en vigueur sont acceptes. */
@Injectable({ providedIn: 'root' })
export class LegalConsentService
{
    private _checked = false;
    private _open = false;

    constructor(private _legalService: LegalService, private _dialog: MatDialog) {}

    /** `url` : la page de gestion des donnees reste accessible sans accepter. */
    check(url = ''): void
    {
        if (url.startsWith('/settings/privacy') || url.startsWith('/legal')) return;
        if (this._checked || this._open) return;
        this._checked = true;
        this._legalService.overview().pipe(catchError(() => of(null))).subscribe((overview) => {
            if (!overview?.pending?.length) return;
            const documents = overview.documents.filter((d) => overview.pending.includes(d.document));
            this._open = true;
            this._dialog
                .open(LegalConsentDialogComponent, { data: { documents }, disableClose: true, autoFocus: false })
                .afterClosed()
                .subscribe((accepted) => {
                    this._open = false;
                    // Refus : redemande a la prochaine navigation de l'application.
                    if (!accepted) this._checked = false;
                });
        });
    }

    reset(): void
    {
        this._checked = false;
    }
}
