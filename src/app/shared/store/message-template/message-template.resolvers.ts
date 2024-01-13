import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { MessageTemplateService } from './message-template.service';
import { MessageTemplateModel } from './message-template.model';
import { CountryModel } from '../country/country.model';
import { CountryService } from '../country/country.service';
import { MessageTemplateState } from './message-template.state';
import { Store } from '@ngxs/store';


@Injectable({
    providedIn: 'root'
})
export class MessageTemplateResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _contactsService: MessageTemplateService,
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<MessageTemplateModel>
    {
        return this._store.select(MessageTemplateState.selectStateByMessageTemplateId(route.paramMap.get('id')))
            .pipe(
                // Error here means the requested contact is not available
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
