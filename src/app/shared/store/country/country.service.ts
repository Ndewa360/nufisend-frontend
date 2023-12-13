import { Injectable } from "@angular/core";
import { CountryModel } from "./country.model";
import { HttpClient } from "@angular/common/http";

import { BehaviorSubject, Observable, tap } from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class CountryService
{
    private _countries: BehaviorSubject<CountryModel[] | null> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient)
    {}

    /**
     * Get countries
     */
    getCountries():Observable<CountryModel[]>
    {
        return this._httpClient.get<CountryModel[]>('api/apps/contacts/countries').pipe(
            tap((countries) => {
                this._countries.next(countries);
            })
        );
    }

    /**
     * Getter for countries
     */
    get countries$(): Observable<CountryModel[]>
    {
        return this._countries.asObservable();
    }
}