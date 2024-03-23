import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ContactModel, GroupAction, GroupModel, GroupState } from 'app/shared/store';
import { Observable, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-select-group',
  templateUrl: './select-group.component.html',
  styleUrls: ['./select-group.component.scss'],
  encapsulation:ViewEncapsulation.None,

})
export class SelectGroupComponent {
  @Select(GroupState.selectStateData) groups$: Observable<GroupModel[]>;
  @Select(GroupState.selectStateLoading) groupLoading$: Observable<boolean>;
  @Input() selectedContact:ContactModel;
  @Input() isNewGroup:boolean=true;
  @Input() editMode:boolean=true;

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  groupsFiltered:GroupModel[]=[]
  groups:GroupModel[]=[]
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  visibilityClasses: {};
  selectectGroups:Map<string,boolean>=new Map();

  displayedColumns: string[] = [ 'avatar','name'];
  selectedGroupList = [];

  @Output() groupsSelected:EventEmitter<GroupModel[]>=new EventEmitter()
  
  @Select(GroupState.selectStateLoading) loading$:Observable<boolean>


  constructor(private _store:Store,
    private _changeDetectorRef: ChangeDetectorRef,
    ){}
  ngOnInit(): void {
    // Get the groups
    this.groups$.subscribe((groups)=>{
      this.groupsFiltered= [...groups];
      this.groups = [...groups ]
      this._changeDetectorRef.markForCheck();
    })



    // Subscribe to search input field value changes
    this.searchInputControl.valueChanges
    .pipe(
        takeUntil(this._unsubscribeAll),
        tap((query:string) =>
            {
                if(query.length<2)
                {
                    this.groupsFiltered=[...this.groups]
                    return;
                }
                // Search
                this.groupsFiltered=this.groups.filter
                    (
                        (group)=> {
                          return `${group.name}`.toLowerCase().includes(query.toLowerCase())
                        }
                    )
              // Mark for check
              this._changeDetectorRef.markForCheck();
            }
        )
    )
    .subscribe();

    if(!this.isNewGroup)
    {
      this.groupLoading$.subscribe((loading)=>{
        if(!loading) this._store.select(GroupState.selectStateByGroupsId(this.selectedContact.groups)).subscribe((values)=>{
          this.selectedGroupList=[...values];
          values.forEach((value)=>this.selectectGroups.set(value._id,true))
          this._changeDetectorRef.markForCheck();
        })
      })
      
    }
  }

  /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
  trackByFn(index: number, item: any): any
  {
      return item._id || index;
  }

  selectGroup(group)
    {
        // this.selectedGroup= group
        if(this.selectectGroups.has(group._id)) return;
        this.selectectGroups.set(group._id,true);
        this.selectedGroupList = [...this.selectedGroupList,group];
        // Mark for check
        this._changeDetectorRef.markForCheck();
        this.emitData();
    }
    emitData()
    {
      this.groupsSelected.next(this.selectedGroupList)
    }

    removeGroup(group)
    {
      this.selectectGroups.delete(group._id);
      let groupFoundIndex = this.selectedGroupList.findIndex((ct)=>ct._id==group._id)
      if(groupFoundIndex>-1) {
        this.selectedGroupList.splice(groupFoundIndex,1);
        this.selectedGroupList=[...this.selectedGroupList];
        this.emitData()
      }   
      // Mark for check
      this._changeDetectorRef.markForCheck();
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
}
