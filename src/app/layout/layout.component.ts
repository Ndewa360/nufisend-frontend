import { Component, Inject, OnDestroy, OnInit, Renderer2, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { DOCUMENT } from '@angular/common';
import { combineLatest, filter, map, Subject, takeUntil } from 'rxjs';
import { FuseConfigService } from '@fuse/services/config';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FusePlatformService } from '@fuse/services/platform';
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
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AppConfig) => {
                if (config) {
                    this.config = config;
                }
            });

        this._fuseMediaWatcherService.onMediaChange$
            .pipe(
                takeUntil(this._unsubscribeAll),
                map(({matchingAliases}: any) => {
                    const config = this._fuseConfigService.config;
                    if (!config) {
                        return 'classy';
                    }
                    if ( matchingAliases && matchingAliases.includes('xl') )
                    {
                        if ( config.layout === 'empty' || config.layout === 'classic' )
                        {
                            return 'classy';
                        }
                    }
                    if ( matchingAliases && matchingAliases.includes('lg') )
                    {
                        if ( config.layout === 'empty' || config.layout === 'classic' )
                        {
                            return 'classy';
                        }
                    }
                    return config.layout;
                })
            )
            .subscribe((layout: any) => {
                if (layout) {
                    this.layout = layout;
                    this._fuseConfigService.config = {layout};
                }
            });

        combineLatest([
            this._fuseConfigService.config$,
        ]).pipe(
            takeUntil(this._unsubscribeAll),
            map(([config]) => {
                if (!config) {
                    return 'light';
                }
                const scheme = config.scheme;
                if ( scheme === 'auto' )
                {
                    return 'light';
                }
                return scheme;
            })
        ).subscribe((scheme: any) => {
            this.scheme = scheme;
            this._updateScheme();
        });

        this.filterNavigationForUser();
        this._router.events.pipe(
            filter(event => event instanceof NavigationEnd),
            takeUntil(this._unsubscribeAll)
        ).subscribe(() => {
            this.filterNavigationForUser();
            this._updateLayout();
        });

        if ( (this._fusePlatformService as any).os === 'ios' )
        {
            this._document.body.classList.add('os-ios');
        }

        this._document.body.classList.add('fuse');
    }

    private filterNavigationForUser(): void
    {
        const user = this._authService.user;
        const isSuperAdmin = user && (user['role'] === 'ADMIN' || user['permissions'] === 'ADMIN' || user['email'] === 'admin@nufisend.ndewa-360.com');
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((nav: any) => {
                if (nav && nav.default) {
                    if (!isSuperAdmin) {
                        nav.default = nav.default.filter((item: any) => item.id !== 'super_admin');
                    }
                    this._navigationService.setNavigation(nav);
                }
            });
    }

    ngOnDestroy(): void
    {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    switchLayout(layout: string): void
    {
        this.layout = layout as Layout;
        this._fuseConfigService.config = {layout};
    }

    private _updateScheme(): void
    {
        this._document.body.classList.remove(this.scheme === 'dark' ? 'light' : 'dark');
        this._document.body.classList.add(this.scheme);
    }

    private _updateLayout(): void
    {
        if (!this.layout) {
            return;
        }
        this._document.body.classList.forEach((className: string) => {
            if ( className.startsWith('fuse-layout-') )
            {
                this._document.body.classList.remove(className);
            }
        });
        this._document.body.classList.add('fuse-layout-' + this.layout);
    }
}
