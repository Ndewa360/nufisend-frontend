import { provideTransloco, Translation, TranslocoModule, TranslocoService } from '@ngneat/transloco';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { TranslocoHttpLoader } from 'app/core/transloco/transloco.http-loader';

@NgModule({
    exports  : [
        TranslocoModule
    ],
    providers: [
        // Transloco 6 : provideTransloco enregistre la configuration, le loader et
        // les services internes (transpiler, missing handler...).
        provideTransloco({
            config: {
                availableLangs      : [
                    {
                        id   : 'fr',
                        label: 'Français'
                    }
                ],
                defaultLang         : 'fr',
                fallbackLang        : 'fr',
                reRenderOnLangChange: true,
                prodMode            : true
            },
            loader: TranslocoHttpLoader
        }),
        {
            // Preload the default language before the app starts to prevent empty/jumping content
            provide   : APP_INITIALIZER,
            deps      : [TranslocoService],
            useFactory: (translocoService: TranslocoService): any => (): Promise<Translation> => {
                const defaultLang = translocoService.getDefaultLang();
                translocoService.setActiveLang(defaultLang);
                return firstValueFrom(translocoService.load(defaultLang));
            },
            multi     : true
        }
    ]
})
export class TranslocoCoreModule
{
}
