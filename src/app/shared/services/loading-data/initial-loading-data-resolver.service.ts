import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Actions, Store, ofActionSuccessful } from "@ngxs/store";
import { UserService } from "app/core/user/user.service";
import { ContactAction, GroupAction, MessageTemplateAction } from "app/shared/store";
import { PlanificationAction } from "app/shared/store/planifcation";
import { UserProfileAction } from "app/shared/store/user-profile";
import { Observable, catchError, combineLatest, combineLatestAll, forkJoin, map, of, skipUntil, skipWhile, take, tap } from "rxjs";

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
        return combineLatest(
            this._store.select((state)=>state.userprofile.userProfile)
            .pipe(
                skipWhile((x)=>x==null),
                tap(()=>this._store.dispatch([
                            new ContactAction.FetchAllContact(),
                            new PlanificationAction.FetchAllPlanification(),
                            new GroupAction.FetchAllGroup(),
                            new MessageTemplateAction.FetchAllMessageTemplate()
                            ])
                    ),
            ),
            this._store.select((state)=>state.contacts.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
            this._store.select((state)=>state.planifications.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
            this._store.select((state)=>state.groups.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
            this._store.select((state)=>state.messageTemplates.initLoadingState).pipe(skipWhile((initLoadingState)=>initLoadingState!="LOADED")),
        )
    }
}
