import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Actions, Store, ofActionSuccessful } from "@ngxs/store";
import { UserService } from "app/core/user/user.service";
import { ContactAction } from "app/shared/store";
import { PlanificationAction } from "app/shared/store/planifcation";
import { UserProfileAction } from "app/shared/store/user-profile";
import { Observable, catchError, forkJoin, map, of, take, tap } from "rxjs";

@Injectable({
    providedIn:"root"
})
export class InitialLoadingDataResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    
    constructor(private _store:Store,private _ngxsAction:Actions,private userProfileService:UserService){}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Use this resolver to resolve initial mock-api for the application
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        
        return of(true)
    }
}
