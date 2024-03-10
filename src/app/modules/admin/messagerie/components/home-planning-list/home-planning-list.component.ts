import { Component, OnDestroy, OnInit, ViewChild,ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Select, Store } from '@ngxs/store';
import { ContactState } from 'app/shared/store';
import { PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-home-planning-list',
  templateUrl: './home-planning-list.component.html',
  styleUrls: ['./home-planning-list.component.scss'],
  encapsulation  : ViewEncapsulation.None,

})
export class HomePlanningListComponent implements OnInit,OnDestroy {

  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  dataTableColumns: string[] = ['titre', 'date', 'destinataires', 'groupes', 'action'];
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  @Select(PlanificationState.selectStateData) planificationList$:Observable<PlanificationModel[]>;
  @ViewChild('dataTable', {read: MatSort}) dataTableMatSort: MatSort;
  contactList=[]
  constructor(private _store:Store){}
  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void
  {
    this.planificationList$.subscribe((value)=>{
      if(!value) return;
      console.log("Value DataSource ",value)
      this.dataSource.data=value
    })
  }

  /**
     * After view init
     */
  ngAfterViewInit(): void
  {
      // Make the data source sortable
      this.dataSource.sort = this.dataTableMatSort;
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
  
  getContactDetail(contactID)
  {
    return this._store.select(ContactState.selectStateByContactId(contactID))
  }
  getListOfContactDetail(contacts)
  {
    this.contactList=contacts.map((contact)=>this._store.select(ContactState.selectStateByContactId(contacts)))
  }

   // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

}
