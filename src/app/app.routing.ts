import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { AdminGuard } from 'app/core/auth/guards/admin.guard';
import { SuperAdminGuard } from 'app/core/auth/guards/super-admin.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';
import { InitialLoadingDataResolver } from './shared/services/loading-data';

export const appRoutes: Route[] = [

    {path: 'signed-in-redirect', pathMatch : 'full', redirectTo: 'dashboard'},

    {
        // Pas de NoAuthGuard ici : les liens de confirmation / reset d'email
        // doivent rester accessibles meme si l'utilisateur est deja connecte.
        // Les pages sign-in / sign-up / forgot-password ont leur propre garde.
        path: 'auth',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        loadChildren: () => import('app/modules/auth/auth.module').then(m => m.AuthModule),
    },

    {
        path: 'home',
        canMatch: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: '', loadChildren: () => import('app/modules/landing/landing.module').then(m => m.LandingHomeModule)},
        ]
    },

    {
        path: 'getting-started',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            {path: '', loadChildren: () => import('app/modules/get-started/get-started.module').then(m => m.GetStartedModule)},
        ]
    },

    {
        path: 'dashboard',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        children: [
            {path: '', loadChildren: () => import('app/modules/admin/dashboard/dashboard.module').then(m => m.DashboardModule)},
        ]
    },
    {
        path: 'annuaire',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        children: [
            {path: 'contacts', loadChildren:() => import('app/modules/admin/contact/contact.module').then(m =>m.ContactModule) },
            {path: 'groups', loadChildren:() => import('app/modules/admin/group/group.module').then(m =>m.GroupModule) },
        ]
    },

    {
        path: 'sync_whatsapp',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        loadChildren:() => import('app/modules/admin/synchro-whatsapp/synchro-whatsapp.module').then(m =>m.SynchroWhatsappModule)
    },
    {
        path: 'message-template',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        loadChildren:() => import('app/modules/admin/message-template/message-template.module').then(m =>m.MessageTemplateModule)
    },
    {
        path: 'messagerie',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        loadChildren:() => import('app/modules/admin/messagerie/messagerie.module').then(m =>m.MessagerieModule)
    },
    {
        path: 'organisation',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        loadChildren:() => import('app/modules/admin/organisation/organisation.module').then(m =>m.OrganisationModule)
    },
    {
        path: 'settings',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        loadChildren:() => import('app/modules/admin/settings/settings.module').then(m =>m.SettingsModule)
    },
    {
        path: 'super-admin',
        canActivate: [AuthGuard, SuperAdminGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        loadChildren:() => import('app/modules/admin/super-admin/super-admin.module').then(m =>m.SuperAdminModule)
    },
    {
        path: 'api-keys',
        canActivate: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
            initialLoadingData: InitialLoadingDataResolver
        },
        data: {
            layout: 'enterprise'
        },
        loadChildren:() => import('app/modules/api/api-keys.module').then(m =>m.ApiKeysModule)
    },

    {path: '**', pathMatch : 'full', redirectTo: 'home'},
];
