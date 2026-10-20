import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Store } from "@ngxs/store";
import { ContactAction, GroupAction, MessageTemplateAction } from "app/shared/store";
import { PlanificationAction } from "app/shared/store/planifcation";
import { Observable, catchError, combineLatest, filter, map, of, take, timeout } from "rxjs";

@Injectable({
    providedIn:"root"
})
export class InitialLoadingDataResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _store:Store){}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Chargement initial des donnees partagees.
     *
     * On declenche les fetches puis on attend que chaque state soit marque LOADED.
     * Un timeout evite de bloquer la navigation (et donc le splash screen / loading bar)
     * si une requete ne se termine jamais.
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        this._store.dispatch([
            new ContactAction.FetchAllContact(),
            new PlanificationAction.FetchAllPlanification(),
            new GroupAction.FetchAllGroup(),
            new MessageTemplateAction.FetchAllMessageTemplate()
        ]);

        return combineLatest([
            this._store.select((state)=>state.contacts.initLoadingState),
            this._store.select((state)=>state.planifications.initLoadingState),
            this._store.select((state)=>state.groups.initLoadingState),
            this._store.select((state)=>state.messageTemplates.initLoadingState)
        ]).pipe(
            map((states)=>states.every((initLoadingState)=>initLoadingState==="LOADED")),
            filter((loaded)=>loaded),
            take(1),
            timeout(20000),
            catchError(()=>of(true))
        );
    }
}
