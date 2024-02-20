import { state, style, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ContactState, ContactModel, ContactAction } from 'app/shared/store';
import { Observable, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-select-contacts-groups',
  templateUrl: './select-contacts-groups.component.html',
  styleUrls: ['./select-contacts-groups.component.scss'],
  encapsulation:ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SelectContactsGroupsComponent implements OnInit {
  
  @Select(ContactState.selectStateData) contacts$: Observable<ContactModel[]>;
  searchInputControl: UntypedFormControl = new UntypedFormControl();
  contactsFiltered:ContactModel[]=[]
  contacts:ContactModel[]=[]
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
    this._store.dispatch(new ContactAction.FetchAllContact())

    this.contacts$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((conts: ContactModel[]) => {
                
                // Update the counts
                this.contactsFiltered=[...conts]
                this.contacts=[...conts]
                // Mark for check
              this._changeDetectorRef.markForCheck();
                
            });


        // Subscribe to search input field value changes
        this.searchInputControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll),
                tap((query:string) =>
                    {
                        if(query.length<2)
                        {
                            this.contactsFiltered=[...this.contacts]
                            return;
                        }
                        // Search
                        this.contactsFiltered=this.contacts.filter
                            (
                                (contact)=> `${contact.fullName} ${contact.jobTitle} ${contact.company}`.toLowerCase().includes(query.toLowerCase())
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

  selectContact(contact)
    {
        // this.selectedContact= contact
        if(this.selectectContactsGroups.has(contact._id)) return;
        this.selectectContactsGroups.set(contact._id,true);
        this.selectedContactList = [...this.selectedContactList,contact];
        // Mark for check
        this._changeDetectorRef.markForCheck();
        this.emitData();
    }
    emitData()
    {
      this.contactsAndGroupsSelected.next({contacts:this.selectedContactList,groups:this.selectedGroupList})
    }
    removeContact(contact)
    {
      this.selectectContactsGroups.delete(contact._id);
      let contactFoundIndex = this.selectedContactList.findIndex((ct)=>ct._id==contact._id)
      if(contactFoundIndex>-1) {
        this.selectedContactList.splice(contactFoundIndex,1);
        this.selectedContactList=[...this.selectedContactList];
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
