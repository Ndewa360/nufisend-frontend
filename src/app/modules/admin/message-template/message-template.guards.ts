import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanDeactivate, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AddComponent } from './add/add.component';
import { DetailComponent } from './detail/detail.component';
// import { ImportComponent } from './import/import.component';


@Injectable({
    providedIn: 'root'
})
export class CanDeactivateMessageTemplatesAdd implements CanDeactivate<AddComponent>
{
    canDeactivate(
        component: AddComponent,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        // Get the next route
        let nextRoute: ActivatedRouteSnapshot = nextState.root;
        while ( nextRoute.firstChild )
        {
            nextRoute = nextRoute.firstChild;
        }

        // If the next state doesn't contain 'message-template'
        // it means we are navigating away from the
        // contacts app
        if ( !nextState.url.includes('/message-template') )
        {
            // Let it navigate
            return true;
        }

        // Close the drawer first, and then navigate
        // return component.closeDrawer().then(() => true);

         // If we are navigating to another task...
         if ( nextRoute.paramMap.get('id') )
         {
             // Just navigate
             return true;
         }
         // Otherwise...
         else
         {
             // Close the drawer first, and then navigate
             return component.closeDrawer().then(() => true);
         }
    }
}





@Injectable({
    providedIn: 'root'
})
export class CanDeactivateMessageTemplatesDetail implements CanDeactivate<DetailComponent>
{
    canDeactivate(
        component: DetailComponent,
        currentRoute: ActivatedRouteSnapshot,
        currentState: RouterStateSnapshot,
        nextState: RouterStateSnapshot
    ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree
    {
        // Get the next route
        let nextRoute: ActivatedRouteSnapshot = nextState.root;
        while ( nextRoute.firstChild )
        {
            nextRoute = nextRoute.firstChild;
        }

        // If the next state doesn't contain 'message-template'
        // it means we are navigating away from the
        // contacts app

        if ( !nextState.url.includes('/message-template') )
        {
            // Let it navigate
            return true;
        }

        // If we are navigating to another contact...
        if ( nextRoute.paramMap.get('id') )
        {
            // Just navigate
            return true;
        }
        // Otherwise...
        else
        {
            // Close the drawer first, and then navigate
            return component.closeDrawer().then(() => true);
        }
    }
}
