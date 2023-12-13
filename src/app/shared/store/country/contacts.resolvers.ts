import { Injectable } from "@angular/core";
import { Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { Observable } from "rxjs";
import { CountryModel } from "./country.model";
import { CountryService } from "./country.service";

@Injectable({
    providedIn: 'root'
})
export class CountriesResolver implements Resolve<any>
{
    /**
     * Constructor
     */
    constructor(private _countryService: CountryService)
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
    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<CountryModel[]>
    {
        return this._countryService.getCountries();
    }
}