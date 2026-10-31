import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';
import { LEGAL_INFO, LEGAL_PAGES } from 'app/core/legal/legal.config';
import { AuthService } from 'app/core/auth/auth.service';

/** Mise en page publique des documents legaux (accessible sans compte). */
@Component({
    selector       : 'app-legal-layout',
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="min-h-screen w-full bg-gray-50 dark:bg-transparent flex flex-col">
            <header class="bg-nufi-900 text-white">
                <div class="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex items-center justify-between gap-4">
                    <a routerLink="/home" class="flex items-center gap-3" aria-label="NufiSend - Accueil">
                        <img src="assets/images/logo/nufisend-logo-white.png" alt="NufiSend" class="h-9 w-auto">
                    </a>
                    <div class="flex items-center gap-2">
                        <a routerLink="/legal" class="hidden sm:inline-flex px-3 py-2 rounded-full text-sm font-semibold text-slate-200 hover:text-white">Informations légales</a>
                        <a [routerLink]="authenticated ? '/dashboard' : '/auth/sign-in'"
                           class="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/20">
                            {{ authenticated ? 'Retour à l’application' : 'Se connecter' }}
                        </a>
                    </div>
                </div>
            </header>

            <div class="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 flex-auto grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">
                <nav class="lg:sticky lg:top-6 self-start bg-card rounded-2xl shadow p-3" aria-label="Documents légaux">
                    <a *ngFor="let page of pages" [routerLink]="['/legal', page.path]" routerLinkActive="bg-nufi-50 text-nufi-800 dark:bg-hover"
                       class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-hover">
                        <mat-icon class="icon-size-5 text-nufi-600" [svgIcon]="page.icon"></mat-icon>
                        <span>{{ page.title }}</span>
                    </a>
                </nav>
                <main class="min-w-0">
                    <router-outlet></router-outlet>
                </main>
            </div>

            <footer class="border-t bg-card">
                <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-sm text-secondary">
                    <span>© {{ year }} {{ info.serviceName }} · édité par {{ info.editorName }}</span>
                    <span>Questions sur vos données : <a class="text-primary underline" [href]="'mailto:' + info.privacyEmail">{{ info.privacyEmail }}</a></span>
                </div>
            </footer>
        </div>
    `,
})
export class LegalLayoutComponent
{
    readonly pages = LEGAL_PAGES;
    readonly info = LEGAL_INFO;
    readonly year = new Date().getFullYear();

    constructor(private _authService: AuthService) {}

    get authenticated(): boolean
    {
        return this._authService.authenticated || !!localStorage.getItem('accessToken');
    }
}

/** Index des documents legaux. */
@Component({
    selector       : 'app-legal-index',
    changeDetection: ChangeDetectionStrategy.OnPush,
    template       : `
        <div class="bg-card rounded-2xl shadow p-6 sm:p-10">
            <h1 class="text-3xl font-extrabold tracking-tight">Informations légales</h1>
            <p class="mt-3 text-secondary max-w-3xl">
                {{ info.serviceName }} respecte la {{ info.lawReference }}. Retrouvez ici l'ensemble des documents qui encadrent
                l'utilisation du service et le traitement de vos données personnelles.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                <a *ngFor="let page of pages" [routerLink]="['/legal', page.path]"
                   class="flex gap-4 rounded-2xl border p-5 hover:border-nufi-500 hover:shadow transition">
                    <mat-icon class="icon-size-7 text-nufi-600 flex-0" [svgIcon]="page.icon"></mat-icon>
                    <div>
                        <div class="font-semibold">{{ page.title }}</div>
                        <div class="text-sm text-secondary mt-1">{{ page.summary }}</div>
                    </div>
                </a>
            </div>
        </div>
    `,
})
export class LegalIndexComponent
{
    readonly pages = LEGAL_PAGES;
    readonly info = LEGAL_INFO;
}
