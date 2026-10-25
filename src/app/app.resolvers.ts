import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot } from '@angular/router';
import { catchError, forkJoin, Observable, of, timeout } from 'rxjs';
import { MessagesService } from 'app/layout/common/messages/messages.service';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { ShortcutsService } from 'app/layout/common/shortcuts/shortcuts.service';

@Injectable({
    providedIn: 'root'
})
export class InitialDataResolver implements Resolve<any>
{
    constructor(
        private _messagesService: MessagesService,
        private _navigationService: NavigationService,
        private _shortcutsService: ShortcutsService,
    )
    {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<any>
    {
        return forkJoin([
            this._navigationService.get(),
            this._messagesService.getAll(),
            this._shortcutsService.getAll(),
        ]).pipe(
            timeout(20000),
            catchError(() => of(null))
        );
    }
}
