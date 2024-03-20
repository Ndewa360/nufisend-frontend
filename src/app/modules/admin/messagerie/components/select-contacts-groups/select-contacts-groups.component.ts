import { state, style, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ContactState, ContactModel, ContactAction, GroupModel, GroupState, GroupAction } from 'app/shared/store';
import { Observable, Subject, combineLatest, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-select-contacts-groups',
  templateUrl: './select-contacts-groups.component.html',
  styleUrls: ['./select-contacts-groups.component.scss'],
  encapsulation:ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectContactsGroupsComponent implements OnInit {
  
  @Select(ContactState.selectStateData) contacts$: Observable<ContactModel[]>;
  @Select(GroupState.selectStateData) groups$: Observable<GroupModel[]>

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  contactsGroupsFiltered:{isGroup:boolean,data:any}[]=[]
  contactsGroups:{isGroup:boolean,data:any}[]=[]
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  private isVisible: boolean = false;
  visibilityClasses: {};
  selectectContactsGroups:Map<string,boolean>=new Map();

  displayedColumns: string[] = [ 'avatar','name'];
  selectedContactList = [];
  selectedGroupList = [];

  @Output() contactsAndGroupsSelected:EventEmitter<{contacts:ContactModel[],groups:any[]}>=new EventEmitter()
  
  @Select(ContactState.selectStateLoading) loading$:Observable<boolean>


  constructor(private _store:Store,
    private _changeDetectorRef: ChangeDetectorRef,
    ){}
  ngOnInit(): void {
    // Get the contacts
    this._store.dispatch([new ContactAction.FetchAllContact(),new GroupAction.FetchAllGroup()])

    combineLatest(this.contacts$,this.groups$).subscribe(([contacts,groups])=>{
      let data = [...contacts.map((cont)=>({isGroup:false,data:cont})),...groups.map((group)=>({isGroup:true,data:group}))]
      this.contactsGroupsFiltered= [...data];
      this.contactsGroups = [...data ]
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
                            this.contactsGroupsFiltered=[...this.contactsGroups]
                            return;
                        }
                        // Search
                        this.contactsGroupsFiltered=this.contactsGroups.filter
                            (
                                (contact)=> {
                                  let field="";
                                  if(contact.isGroup) field=contact.data.name;
                                  else field=`${contact.data.fullName} ${contact.data.jobTitle} ${contact.data.company}`;
                                  return field.toLowerCase().includes(query.toLowerCase())
                                }
                            )
                      // Mark for check
                      this._changeDetectorRef.markForCheck();
                    }
                )
            )
            .subscribe();
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

  selectContact(contactGroup)
    {
        // this.selectedContact= contactGroup
        if(this.selectectContactsGroups.has(contactGroup.data._id)) return;
        this.selectectContactsGroups.set(contactGroup.data._id,true);
        if(contactGroup.isGroup) this.selectedGroupList = [...this.selectedGroupList,contactGroup.data];
        else this.selectedContactList = [...this.selectedContactList,contactGroup.data];
        // Mark for check
        this._changeDetectorRef.markForCheck();
        this.emitData();
    }
    emitData()
    {
      this.contactsAndGroupsSelected.next({contacts:this.selectedContactList,groups:this.selectedGroupList})
    }
    removeContactGroup(contactGroup)
    {
      this.selectectContactsGroups.delete(contactGroup.data._id);
      if(contactGroup.isGroup)
      {
        let groupFoundIndex = this.selectedGroupList.findIndex((ct)=>ct._id==contactGroup.data._id)
        if(groupFoundIndex>-1) {
          this.selectedGroupList.splice(groupFoundIndex,1);
          this.selectedGroupList=[...this.selectedGroupList];
          this.emitData()
        }
      }
      else
      {
        let contactFoundIndex = this.selectedContactList.findIndex((ct)=>ct._id==contactGroup.data._id)
        if(contactFoundIndex>-1) {
          this.selectedContactList.splice(contactFoundIndex,1);
          this.selectedContactList=[...this.selectedContactList];
          this.emitData()
        }
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
