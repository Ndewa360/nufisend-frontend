import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { Observable } from 'rxjs';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { Navigation } from 'app/core/navigation/navigation.types';

@Injectable({
    providedIn: 'root'
})
export class InitialDataResolver implements Resolve<Navigation>
{
    constructor(private _navigationService: NavigationService)
    {
    }

    resolve(): Observable<Navigation>
    {
        return this._navigationService.get();
    }
}
