import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ExtraOptions, PreloadAllModules, Router, RouterModule } from '@angular/router';
import { NgxsModule } from '@ngxs/store'
import { FuseModule } from '@fuse';
import { FuseConfigModule } from '@fuse/services/config';
import { FuseMockApiModule } from '@fuse/lib/mock-api';
import { CoreModule } from 'app/core/core.module';
import { appConfig } from 'app/core/config/app.config';
import { mockApiServices } from 'app/mock-api';
import { LayoutModule } from 'app/layout/layout.module';
import { AppComponent } from 'app/app.component';
import { appRoutes } from 'app/app.routing';
import { KeycloakAngularModule, KeycloakService } from 'keycloak-angular';
import { initializeKeycloak } from './core/auth/keycloak-init';
import { environment } from 'environments/environment';
import { ContactState, MessageTemplateState, MessageTemplateStateModel } from './shared/store';
import { GlobalState } from './shared/store/global';
import { ToastrModule } from 'ngx-toastr';
import { FuseLoadingModule } from '@fuse/services/loading';
import { UserProfileState } from './shared/store/user-profile';
import { SocketIoModule } from 'ngx-socket-io';
import { WebsocketManagerService } from './shared/services/websocket-manager/websocket-manager.service';

const routerConfig: ExtraOptions = {
    preloadingStrategy       : PreloadAllModules,
    scrollPositionRestoration: 'enabled'
};

@NgModule({
    declarations: [
        AppComponent
    ],
    imports     : [
        BrowserModule,
        BrowserAnimationsModule,
        RouterModule.forRoot(appRoutes, routerConfig),

        // Fuse, FuseConfig, FuseMockAPI, FuseLoading
        FuseModule,
        FuseConfigModule.forRoot(appConfig),
        FuseMockApiModule.forRoot(mockApiServices),
        FuseLoadingModule,

        // Core module of your application
        CoreModule,

        // Layout module of your application
        LayoutModule,

        //Keycloak module for auth
        KeycloakAngularModule,

        //Ngxs module
        NgxsModule.forRoot([ContactState,GlobalState,UserProfileState,MessageTemplateState], {
        developmentMode: !environment.production
        }),

        //Toatr module init
        ToastrModule.forRoot(),

        //Socket.IO module
        SocketIoModule
    ],
    bootstrap   : [
        AppComponent
    ],
    providers: [
        {
            provide:APP_INITIALIZER,
            useFactory:initializeKeycloak,
            multi:true,
            deps:[KeycloakService,Router]
          },
          WebsocketManagerService
    ]
})
export class AppModule
{
}
