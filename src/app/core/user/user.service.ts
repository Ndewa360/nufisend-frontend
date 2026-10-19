import { Injectable } from '@angular/core';
import { Observable, ReplaySubject } from 'rxjs';
import { User } from '../auth/auth.service';
import { Store } from '@ngxs/store';
import { UserProfileAction } from 'app/shared/store/user-profile';
import { WebsocketManagerService } from 'app/shared/services/websocket-manager/websocket-manager.service';

@Injectable({
    providedIn: 'root'
})
export class UserService
{
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);

    constructor(
        private _store: Store,
        private _socketWhatsappService: WebsocketManagerService
    )
    {
    }

    set user(value: User | null)
    {
        if ( value )
        {
            this._user.next(value);
            this._store.dispatch(new UserProfileAction.FetchUserProfile(value.email));
            this._socketWhatsappService.customConnexion(value as any);
        }
    }

    get user$(): Observable<User>
    {
        return this._user.asObservable();
    }
}
