import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';

const STORAGE_KEY = 'nufisend-cookie-notice';
const VALIDITY_MS = 365 * 86_400_000;

/**
 * Information sur le stockage local : le site n'utilise que des elements
 * strictement necessaires (aucun consentement requis), l'utilisateur en est
 * informe une fois par an.
 */
@Component({
    selector       : 'app-cookie-notice',
    standalone     : true,
    imports        : [CommonModule, RouterModule, MatButtonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div *ngIf="visible" role="region" aria-label="Information sur les cookies"
             class="fixed inset-x-0 bottom-0 z-[999] p-4 sm:p-6 print:hidden">
            <div class="mx-auto max-w-3xl rounded-2xl bg-card shadow-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <p class="text-sm text-secondary flex-auto">
                    NufiSend n'utilise ni cookie publicitaire ni mesure d'audience : seuls les éléments nécessaires à votre connexion
                    et à vos préférences sont enregistrés dans votre navigateur.
                    <a class="text-primary underline" routerLink="/legal/cookies">En savoir plus</a>
                </p>
                <button mat-flat-button color="primary" type="button" (click)="dismiss()">J'ai compris</button>
            </div>
        </div>
    `,
})
export class CookieNoticeComponent
{
    visible = false;

    constructor()
    {
        try {
            const seen = Number(localStorage.getItem(STORAGE_KEY) || 0);
            this.visible = !seen || Date.now() - seen > VALIDITY_MS;
        } catch {
            this.visible = false;
        }
    }

    dismiss(): void
    {
        this.visible = false;
        try {
            localStorage.setItem(STORAGE_KEY, String(Date.now()));
        } catch {
            // stockage indisponible : le bandeau reapparaitra
        }
    }
}
