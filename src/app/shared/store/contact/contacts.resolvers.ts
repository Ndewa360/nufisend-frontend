import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot } from '@angular/router';
import { catchError, Observable, throwError } from 'rxjs';
import { ContactService } from './contact.service';
import { ContactModel } from './contact.model';
import { CountryModel } from '../country/country.model';
import { CountryService } from '../country/country.service';


@Injectable({
    providedIn: 'root'
})
export class ContactsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _contactsService: ContactService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ContactModel[]>
    {
        return this._contactsService.getContacts();
    }
}

@Injectable({
    providedIn: 'root'
})
export class ContactsContactResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(
        private _contactsService: ContactService,
        private _router: Router
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ContactModel>
    {
        return null;
        // this._contactsService.getContactById(route.paramMap.get('id'))
        //            .pipe(
        //                // Error here means the requested contact is not available
        //                catchError((error) => {

        //                    // Log the error
        //                    console.error(error);

        //                    // Get the parent url
        //                    const parentUrl = state.url.split('/').slice(0, -1).join('/');

        //                    // Navigate to there
        //                    this._router.navigateByUrl(parentUrl);

        //                    // Throw an error
        //                    return throwError(error);
        //                })
        //            );
    }
}



@Injectable({
    providedIn: 'root'
})
export class ContactsTagsResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _contactsService: ContactsService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Tag[]>
    {
        return this._contactsService.getTags();
    }
}
