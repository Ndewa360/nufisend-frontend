import { ChangeDetectorRef, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ContactAction, ContactModel, ContactState, GroupModel } from 'app/shared/store';
import { Observable, Subject, takeUntil, tap } from 'rxjs';

@Component({
  selector: 'app-select-contact',
  templateUrl: './select-contact.component.html',
  styleUrls: ['./select-contact.component.scss'],
  encapsulation:ViewEncapsulation.None,

})
export class SelectContactComponent {
  @Select(ContactState.selectStateData) contacts$: Observable<ContactModel[]>;
  @Select(ContactState.selectStateLoading) contactLoading$: Observable<boolean>;
  @Input() selectedGroup:GroupModel;
  @Input() isNewGroup:boolean=true;
  @Input() editMode:boolean=true;

  searchInputControl: UntypedFormControl = new UntypedFormControl();
  contactsFiltered:ContactModel[]=[]
  contacts:ContactModel[]=[]
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  visibilityClasses: {};
  selectectContacts:Map<string,boolean>=new Map();

  displayedColumns: string[] = [ 'avatar','name'];
  selectedContactList = [];

  @Output() contactsSelected:EventEmitter<ContactModel[]>=new EventEmitter()
  
  @Select(ContactState.selectStateLoading) loading$:Observable<boolean>


  constructor(private _store:Store,
    private _changeDetectorRef: ChangeDetectorRef,
    ){}
  ngOnInit(): void {
    // Get the contacts
    this.contacts$.subscribe((contacts)=>{
      this.contactsFiltered= [...contacts];
      this.contacts = [...contacts ]
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
                    this.contactsFiltered=[...this.contacts]
                    return;
                }
                // Search
                this.contactsFiltered=this.contacts.filter
                    (
                        (contact)=> {
                          return `${contact.fullName} ${contact.jobTitle} ${contact.company}`.toLowerCase().includes(query.toLowerCase())
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
      this.contactLoading$.subscribe((loading)=>{
        if(!loading) this._store.select(ContactState.selectStateByContactsId(this.selectedGroup?.contacts || [])).subscribe((values)=>{
          this.selectedContactList=[...values];
          values.forEach((value)=>this.selectectContacts.set(value._id,true))
          this.emitData();
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

  selectContact(contact)
    {
        // this.selectedContact= contact
        if(this.selectectContacts.has(contact._id)) return;
        this.selectectContacts.set(contact._id,true);
        this.selectedContactList = [...this.selectedContactList,contact];
        // Mark for check
        this._changeDetectorRef.markForCheck();
        this.emitData();
    }
    emitData()
    {
      this.contactsSelected.next(this.selectedContactList)
    }

    removeContact(contact)
    {
      this.selectectContacts.delete(contact._id);
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
