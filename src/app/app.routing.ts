import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';
import { InitialLoadingDataResolver } from './shared/services/loading-data';

// @formatter:off
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [

    

    // Redirect signed-in user to the '/example'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    {path: 'signed-in-redirect', pathMatch : 'full', redirectTo: 'example'},

    
    // Auth routes for authenticated users
    {
        path: 'sign-out',
        // canActivate: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        loadChildren: () => import('app/modules/auth/sign-out/sign-out.module').then(m => m.AuthSignOutModule),
    },
    
    // Landing routes
    {
        path: 'home',
        component: LayoutComponent,
        // canActivate: [NoAuthGuard],
        data: {
            layout: 'empty'
        },
        children: [
            {path: '', loadChildren: () => import('app/modules/landing/landing.module').then(m => m.LandingHomeModule)},
        ]
    },

    // Landing routes
    {
        path: 'getting-started',
        component: LayoutComponent,
        // canActivate: [NoAuthGuard],
        data: {
            layout: 'empty'
        },
        children: [
            {path: '', loadChildren: () => import('app/modules/get-started/get-started.module').then(m => m.GetStartedModule)},
        ]
    },

    // Admin routes
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
    // Annuaire routes
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

    //Whatsapp sync
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
        loadChildren:() => import('app/modules/admin/example/example.module').then(m =>m.ExampleModule) 
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
        loadChildren:() => import('app/modules/admin/example/example.module').then(m =>m.ExampleModule) 
    },

    // Redirect empty path to '/home'
    {path: '**', pathMatch : 'full', redirectTo: 'home'},
];
