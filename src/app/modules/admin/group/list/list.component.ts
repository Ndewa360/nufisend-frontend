import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatDrawer } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseMediaWatcherService } from '@fuse/services/media-watcher';
import { Select, Store } from '@ngxs/store';
import { ContactState, GroupModel, GroupState } from 'app/shared/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { DateTime } from 'luxon';
import { NewMessageForSingleContactComponent } from '../../messagerie/components/new-message-for-single-contact/new-message-for-single-contact.component';
import { AddComponent } from '../add/add.component';


@Component({
  selector: 'app-list-group',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class ListComponent implements OnInit, OnDestroy{
  @ViewChild('matDrawer', {static: true}) matDrawer: MatDrawer;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  selectedGroup:GroupModel=null;
  drawerMode: 'side' | 'over';


  @Select(GroupState.selectStateData) groups$:Observable<GroupModel[]>

  constructor(
    private _changeDetectorRef: ChangeDetectorRef,
    private _fuseMediaWatcherService: FuseMediaWatcherService,
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _matDialog: MatDialog, 
    private _store:Store

  ){}
      // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {
      // Subscribe to MatDrawer opened change
      this.matDrawer.openedChange.subscribe((opened) => {
        if ( !opened )
        {
            // Remove the group contact when drawer closed
            this.selectedGroup = null;

            // Mark for check
            this._changeDetectorRef.markForCheck();
        }
      });

      // Subscribe to media changes
        this._fuseMediaWatcherService.onMediaQueryChange$('(min-width: 1440px)')
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((state) => {

                // Calculate the drawer mode
                this.drawerMode = state.matches ? 'side' : 'over';

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

    }

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }


     // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * On backdrop clicked
     */
    onBackdropClicked(): void
    {
        // Go back to the list
        this._router.navigate(['./'], {relativeTo: this._activatedRoute});

        // Mark for check
        this._changeDetectorRef.markForCheck();
    }

    getGroupMember(group)
    {
      return this._store.select(ContactState.selectStateByContactsId(group.contacts))
    }

    createGroup()
    {
      // Create the group

      // Go to the new group
      this._router.navigate(['./new'], {relativeTo: this._activatedRoute});

      // Mark for check
    }

    /**
     * Format the given ISO_8601 date as a relative date
     *
     * @param date
     */
    formatDateAsRelative(date: string): string
    {
        return DateTime.fromISO(date).setLocale('fr').toRelative();
    }

}
