import { Component, Inject, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { combineLatest, filter, map, Subject, take, takeUntil } from 'rxjs';
import { FuseConfigService } from '@fuse/services/config';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FusePlatformService } from '@fuse/services/platform';
import { FUSE_VERSION } from '@fuse/version';
import { Layout } from 'app/layout/layout.types';
import { AppConfig } from 'app/core/config/app.config';
import { AuthService } from 'app/core/auth/auth.service';
import { NavigationService } from 'app/core/navigation/navigation.service';

@Component({
    selector     : 'layout',
    templateUrl  : './layout.component.html',
    styleUrls    : ['./layout.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LayoutComponent implements OnInit, OnDestroy
{
    config: AppConfig;
    layout: Layout;
    scheme: 'dark' | 'light';
    theme: string;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        @Inject(DOCUMENT) private _document: any,
        private _renderer2: Renderer2,
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fusePlatformService: FusePlatformService,
        private _authService: AuthService,
        private _navigationService: NavigationService
    )
    {
    }

    ngOnInit(): void
    {
        // Set the theme and scheme based on the configuration
        combineLatest([
            this._fuseConfigService.config$,
            this._fuseMediaWatcherService.onMediaQueryChange$(['(prefers-color-scheme: dark)', '(prefers-color-scheme: light)'])
        ]).pipe(
            takeUntil(this._unsubscribeAll),
            map(([config, mql]) => {
                const options = {
                    scheme: config.scheme,
                    theme : config.theme
                };
                if ( config.scheme === 'auto' )
                {
                    options.scheme = mql.breakpoints['(prefers-color-scheme: dark)'] ? 'dark' : 'light';
                }
                return options;
            })
        ).subscribe((options) => {
            this.scheme = options.scheme;
            this.theme = options.theme;
            this._updateScheme();
            this._updateTheme();
        });

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AppConfig) => {
                this.config = config;
                this._updateLayout();
            });

        // Subscribe to NavigationEnd event
        this._router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntil(this._unsubscribeAll)
        ).subscribe(() => {
            this._updateLayout();
        });

        // Filter navigation items based on user role — take(1) prevents infinite loop
        this._navigationService.navigation$
            .pipe(take(1))
            .subscribe((nav: any) => {
                if (nav && nav.default) {
                    const user = this._authService.user;
                    const isSuperAdmin = !!(user && user['role'] === 'ADMIN');
                    if (!isSuperAdmin) {
                        nav.default = nav.default.filter((item: any) => item.id !== 'super_admin');
                        this._navigationService.setNavigation(nav);
                    }
                }
            });

        // Set the app version
        this._renderer2.setAttribute(this._document.querySelector('[ng-version]'), 'fuse-version', FUSE_VERSION);

        // Set the OS name
        this._renderer2.addClass(this._document.body, this._fusePlatformService.osName);
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private _updateLayout(): void
    {
        let route = this._activatedRoute;
        while ( route.firstChild )
        {
            route = route.firstChild;
        }

        // 1. Set the layout from the config
        this.layout = this.config.layout;

        // 2. Get the query parameter from the current route
        const layoutFromQueryParam = (route.snapshot.queryParamMap.get('layout') as Layout);
        if ( layoutFromQueryParam )
        {
            this.layout = layoutFromQueryParam;
            if ( this.config )
            {
                this.config.layout = layoutFromQueryParam;
            }
        }

        // 3. Iterate through the paths and change the layout as we find a config for it
        const paths = route.pathFromRoot;
        paths.forEach((path) => {
            if ( path.routeConfig && path.routeConfig.data && path.routeConfig.data.layout )
            {
                this.layout = path.routeConfig.data.layout;
            }
        });
    }

    private _updateScheme(): void
    {
        this._document.body.classList.remove('light', 'dark');
        this._document.body.classList.add(this.scheme);
    }

    private _updateTheme(): void
    {
        this._document.body.classList.forEach((className: string) => {
            if ( className.startsWith('theme-') )
            {
                this._document.body.classList.remove(className, className.split('-')[1]);
            }
        });
        this._document.body.classList.add(this.theme);
    }
}
