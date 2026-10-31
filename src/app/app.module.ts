import { APP_INITIALIZER, LOCALE_ID, NgModule } from '@angular/core';
import { CookieNoticeComponent } from 'app/shared/components/cookie-notice/cookie-notice.component';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, PreloadAllModules, RouterModule } from '@angular/router';
import { NgxsModule } from '@ngxs/store'
import { FuseModule } from '@fuse';
import { FuseConfigModule } from '@fuse/services/config';
import { CoreModule } from 'app/core/core.module';
import { appConfig } from 'app/core/config/app.config';
import { LayoutModule } from 'app/layout/layout.module';
import { AppComponent } from 'app/app.component';
import { appRoutes } from 'app/app.routing';
import { environment } from 'environments/environment';
import { ContactState, MessageState, MessageTemplateState, GlobalState, WhatsappContactState, WhatsappQrCodeState } from './shared/store';
import { ToastrModule } from 'ngx-toastr';
import { FuseLoadingModule } from '@fuse/services/loading';
import { UserProfileState } from './shared/store/user-profile';
import { SocketIoModule } from 'ngx-socket-io';
import { GroupState } from './shared/store/group';
import { PlanificationState } from './shared/store/planifcation';

registerLocaleData(localeFr);

const routerConfig: ExtraOptions = {
    preloadingStrategy       : PreloadAllModules,
    scrollPositionRestoration: 'enabled'
};

@NgModule({
    declarations: [
        AppComponent,
    ],
    imports     : [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(appRoutes, routerConfig),

        FuseModule,
        FuseConfigModule.forRoot(appConfig),
        FuseLoadingModule,

        CoreModule,
        CookieNoticeComponent,

        LayoutModule,

        NgxsModule.forRoot([
            ContactState,
            GlobalState,
            UserProfileState,
            MessageTemplateState,
            WhatsappContactState,
            MessageState,
            GroupState,
            WhatsappQrCodeState,
            PlanificationState
        ], {
        developmentMode: !environment.production
        }),

        ToastrModule.forRoot(),

        SocketIoModule.forRoot({
            url: environment.apiUrl,
            options: {
                autoConnect: false
            }
        })
    ],
    bootstrap   : [
        AppComponent
    ],
    providers: [
        { provide: LOCALE_ID, useValue: 'fr-FR' }
    ]
})
export class AppModule
{
}
