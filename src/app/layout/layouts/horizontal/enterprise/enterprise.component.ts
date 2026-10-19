import { ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject, combineLatest, takeUntil } from 'rxjs';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { FuseNavigationService, FuseVerticalNavigationComponent } from '@fuse/components/navigation';
import { Navigation } from 'app/core/navigation/navigation.types';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { User } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { Actions, Select, Store, ofActionSuccessful } from '@ngxs/store';
import { UserProfileState, UserProfileModel, UserProfileAction } from 'app/shared/store/user-profile';
import { ToastrService } from 'ngx-toastr';
import { FuseAlertService } from '@fuse/components/alert';
import { GlobalState } from 'app/shared/store';

@Component({
    selector     : 'enterprise-layout',
    templateUrl  : './enterprise.component.html',
    encapsulation: ViewEncapsulation.None
})
export class EnterpriseLayoutComponent implements OnInit, OnDestroy
{
    fixedMenu: boolean = false;
    menuPosition:any;
    user: User | null = null;
    userProfile:UserProfileModel=null;
    @ViewChild('stickyMenu') menuElement: ElementRef;
    hasConnectedWhatsApp = false;
    isScreenSmall: boolean;
    navigation: Navigation;
    showSynchroWhatsappAlert:boolean=false;
    showSynchroWhatsappLoading:boolean=false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @Select(UserProfileState.selectStateData) userProfile$:Observable<UserProfileModel>
    @Select(GlobalState.selectStateConnectedWhatsApp) hasWhatsappConnected$:Observable<boolean>;
    
    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _router: Router,
        private _navigationService: NavigationService,
        private _fuseMediaWatcherService: FuseMediaWatcherService,
        private _fuseNavigationService: FuseNavigationService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _userService:UserService,
        private _toastrService:ToastrService,
        private _fuseAlertService: FuseAlertService,
        private _store:Store,private _ngxsAction:Actions

    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for current year
     */
    get currentYear(): number
    {
        return new Date().getFullYear();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
        // Subscribe to navigation data
        this._navigationService.navigation$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((navigation: Navigation) => {
                this.navigation = navigation;
            });

        // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaChange$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(({matchingAliases}) => {

                // Check if the screen is small
                this.isScreenSmall = !matchingAliases.includes('md');
            });

        this._userService.user$
        .pipe(takeUntil(this._unsubscribeAll))
        .subscribe((user: User | null) => {
            this.user = user;
            this._changeDetectorRef.markForCheck();
        });

        this._fuseAlertService.onDismiss.subscribe((value)=>{
            if(value=="synchro_whatsapp") this.showSynchroWhatsappAlert=false
            if(value=="synchro_whatsapp_loading") this.showSynchroWhatsappLoading=false;
        })

        combineLatest([
            this._ngxsAction.pipe
            (
                takeUntil(this._unsubscribeAll),
                ofActionSuccessful(UserProfileAction.FetchUserProfile)
            ),
            this.userProfile$
        ]) .subscribe(([_,user])=>{
            if(user && user.hasSyncWhatsApp) 
            {
                if(!this.userProfile) {                    
                    if(!this.hasConnectedWhatsApp) {
                        this._fuseAlertService.show("synchro_whatsapp_loading")
                        this.showSynchroWhatsappLoading=true;
                    }
                    this._fuseAlertService.dismiss("synchro_whatsapp")
                    this.showSynchroWhatsappAlert=false
                }
                
            }
            else if(user)
            {
                this.userProfile = user;
                this._fuseAlertService.show("synchro_whatsapp")
                this._fuseAlertService.dismiss("synchro_whatsapp_loading")
                this.showSynchroWhatsappAlert=true
                this.showSynchroWhatsappLoading=false;

            }
        })

        this.hasWhatsappConnected$.subscribe((value)=> {
            if(value) {
                this._fuseAlertService.dismiss('synchro_whatsapp_loading')
                
                this.showSynchroWhatsappAlert=false
                this.showSynchroWhatsappLoading=false;
            }
          })
    }

    ngAfterViewInit(){
        this.menuPosition = this.menuElement.nativeElement.offsetTop
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle navigation
     *
     * @param name
     */
    toggleNavigation(name: string): void
    {
        // Get the navigation
        const navigation = this._fuseNavigationService.getComponent<FuseVerticalNavigationComponent>(name);

        if ( navigation )
        {
            // Toggle the opened status
            navigation.toggle();
        }
    }

    @HostListener('window:scroll', ['$event'])
    handleScroll(){
      const windowScroll = window.scrollY;
      if(windowScroll >= this.menuPosition){
        this.fixedMenu = true;
      } else {
        this.fixedMenu = false;
      }
    }
}
