import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { GroupService } from './group.service';
import { GroupModel } from './group.model';
import { CountryModel } from '../country/country.model';
import { CountryService } from '../country/country.service';
import { GroupState } from './group.state';
import { Store } from '@ngxs/store';


@Injectable({
    providedIn: 'root'
})
export class GroupResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _groupsService: GroupService,
        private _router: Router,
        private _store:Store
    )
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resolver
     *
     * @param route
     * @param state
     */
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<GroupModel>
    {
        return this._store.select(GroupState.selectStateByGroupId(route.paramMap.get('id')))
            .pipe(
                // Error here means the requested group is not available
                catchError((error) => {

                    // Log the error
                    console.error(error);

                    // Get the parent url
                    const parentUrl = state.url.split('/').slice(0, -1).join('/');

                    // Navigate to there
                    this._router.navigateByUrl(parentUrl);

                    // Throw an error
                    return throwError(error);
                })
            );
    }
}
