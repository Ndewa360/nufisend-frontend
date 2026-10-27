import { Injectable } from '@angular/core';
import { Observable, of, ReplaySubject, tap } from 'rxjs';
import { Navigation } from 'app/core/navigation/navigation.types';
import { buildNavigation } from 'app/core/navigation/navigation.data';

@Injectable({
    providedIn: 'root'
})
export class NavigationService
{
    private _navigation: ReplaySubject<Navigation> = new ReplaySubject<Navigation>(1);

    /**
     * Constructor
     */
    constructor()
    {
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation>
    {
        return this._navigation.asObservable();
    }

    /**
     * Setter for navigation
     */
    setNavigation(navigation: Navigation): void
    {
        this._navigation.next(navigation);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation>
    {
        // Menu statique : il etait auparavant servi par la Mock API de Fuse.
        return of(buildNavigation()).pipe(
            tap((navigation) => {
                this._navigation.next(navigation);
            })
        );
    }
}
