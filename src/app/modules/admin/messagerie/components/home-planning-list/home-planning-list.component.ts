import { Component, OnDestroy, OnInit, ViewChild,ViewEncapsulation } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Actions, Select, Store, ofActionCompleted } from '@ngxs/store';
import { ContactState, GroupState } from 'app/shared/store';
import { PlanificationAction, PlanificationModel, PlanificationState } from 'app/shared/store/planifcation';
import { Observable, Subject, firstValueFrom, lastValueFrom } from 'rxjs';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { MatMenuTrigger } from '@angular/material/menu';

@Component({
  selector: 'app-home-planning-list',
  templateUrl: './home-planning-list.component.html',
  styleUrls: ['./home-planning-list.component.scss'],
  encapsulation  : ViewEncapsulation.None,

})
export class HomePlanningListComponent implements OnInit,OnDestroy {

  dataSource: MatTableDataSource<any> = new MatTableDataSource();
  dataBackLog=[]
  dataTableColumns: string[] = ['titre', 'date', 'destinataires', 'groupes', 'action'];
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  @Select(PlanificationState.selectStateData) planificationList$:Observable<PlanificationModel[]>;
  @ViewChild('dataTable', {read: MatSort}) dataTableMatSort: MatSort;
  @ViewChild("contactListMenu") contactListMenu: MatMenuTrigger;
  @ViewChild("groupListMenu") groupListMenu: MatMenuTrigger;

  contactList=[]
  groupList=[]
  submited:boolean=false;
  constructor(private _store:Store,
    private _ngxsAction:Actions,
    private _fuseConfirmationService: FuseConfirmationService,

    ){}
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
      this.dataBackLog=[...value];      
      this.showData();
    })

    this._ngxsAction.pipe(ofActionCompleted(PlanificationAction.UpdatePlanification)).subscribe(
      (value)=> this.submited=false
    );
    this._ngxsAction.pipe(ofActionCompleted(PlanificationAction.DeletePlanification)).subscribe(
      (value) =>this.submited=false
    )

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

   // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------


    showData()
    {
      if(!this.submited) this.dataSource.data=[...this.dataBackLog]
      else this.dataSource.data=[];
    }

  getGroupDetail(groupID)
  {
    return this._store.select(GroupState.selectStateByGroupId(groupID))
  }

  async getListOfGroupDetail(groups)
  {
    this.groupList= await lastValueFrom(this._store.select(GroupState.selectStateByGroupsId(groups)))
    this.groupListMenu.openMenu();
  }

  getContactDetail(contactID)
  {
    return this._store.select(ContactState.selectStateByContactId(contactID))
  }
  async getListOfContactDetail(contacts)
  {
    this.contactList= await lastValueFrom(this._store.select(ContactState.selectStateByContactsId(contacts)))
    this.contactListMenu.openMenu();
  }

  desablePlaning(plan)
  {
    this.submited=true;
    this._store.dispatch(new PlanificationAction.UpdatePlanification({isActive:false},plan._id))
  }

  deletePlaning(plan)
  {
    // Open the confirmation dialog
    const confirmation = this._fuseConfirmationService.open({
      title  : 'Supprimer la tâche',
      message: 'Voulez-vous vraiment supprimer cette tâche? Cette action est irréversible!',
      actions: {
          confirm: {
              label: 'Supprimer'
          },
          'cancel':{
            label: 'Annuler'
          }
      }
    });

    // Subscribe to the confirmation dialog closed action
    confirmation.afterClosed().subscribe((result) => {
        // If the confirm button pressed...
        if ( result === 'confirmed' )
        {
          this.submited=true;
          this._store.dispatch(new PlanificationAction.DeletePlanification(plan._id))
        }
    });
    
  }
 
  enablePlaning(plan)
  {
    this.submited=true;
    this._store.dispatch(new PlanificationAction.UpdatePlanification({isActive:true},plan._id))
  }
}
