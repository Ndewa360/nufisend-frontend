import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store, Actions, ofActionSuccessful, ofActionCompleted, ofActionErrored } from '@ngxs/store';
import { ContactModel, CountryModel, CountryService, ContactAction, ContactState } from 'app/shared/store';
import { FormUtils } from 'app/shared/utils/form-utils';
import { OverlayRef, Overlay } from '@angular/cdk/overlay';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ListComponent } from '../list/list.component';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
  encapsulation  : ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailComponent {
  @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
  @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
  @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;
  submitted = false
  editMode: boolean = false;

  contact: ContactModel=null;
  
  contactForm: UntypedFormGroup;
  countries: CountryModel[]=[];
  private _tagsPanelOverlayRef: OverlayRef;
  private _unsubscribeAll: Subject<any> = new Subject<any>();
  isLoading=true;
  

  /**
   * Constructor
   */
  constructor(
      private _activatedRoute: ActivatedRoute,
      private _changeDetectorRef: ChangeDetectorRef,
      private _contactsListComponent: ListComponent,
      private _countryService:CountryService,
      private _formBuilder: UntypedFormBuilder,
      private _fuseConfirmationService: FuseConfirmationService,
      private _renderer2: Renderer2,
      private _router: Router,
      private _overlay: Overlay,
      private _viewContainerRef: ViewContainerRef,
      private _store:Store,
      private _ngxsAction:Actions
  )
  {
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Lifecycle hooks
  // -----------------------------------------------------------------------------------------------------

  /**
   * On init
   */
  ngOnInit(): void
  {
      // Open the drawer
      this._contactsListComponent.matDrawer.open();

      // Get the country telephone codes
      this._countryService.countries$
          .pipe(takeUntil(this._unsubscribeAll))
          .subscribe((codes: CountryModel[]) => {
              this.countries = codes;

              // Mark for check
              this._changeDetectorRef.markForCheck();
          });

      // Create the contact form
      this.contactForm = this._formBuilder.group({
          // avatar      : [null],
          fullName       : ['', [Validators.required]],
          emails         : this._formBuilder.array([]),
          phoneNumbers   : this._formBuilder.array([]),
          jobTitle       : [null],
          company        : [null],
          birthday       : [null],
          address        : [null],
          about          : [null],
          websiteLink    : [null],
          // skype          : [""],
      });

      this._store.select(ContactState.selectStateByContactId(this._activatedRoute.snapshot.paramMap.get('id')))
      .pipe(takeUntil(this._unsubscribeAll))
      .subscribe((value)=>{
        this.isLoading = false;
        if(!value) return;
        this.updateSelectedContact(value);        
      });
      
    this._ngxsAction.pipe
    (
        takeUntil(this._unsubscribeAll),
        ofActionSuccessful(ContactAction.UpdateContact)
    )
    .subscribe(
      (value:any)=>{
        this.toggleEditMode(false)
        this.updateSelectedContact(value.contact)
      }
    );

    this._ngxsAction.pipe
    (
        takeUntil(this._unsubscribeAll),
        ofActionCompleted(ContactAction.UpdateContact)
    )
    .subscribe(
      (value) => {
        this.submitted=false
        // Mark for check
        this._changeDetectorRef.markForCheck();
      }
    )

    this._ngxsAction.pipe
    (
        takeUntil(this._unsubscribeAll),
        ofActionSuccessful(ContactAction.DeleteContact)
    )
    .subscribe(
        (value) => {
            this.isLoading =false
          // Navigate to the parent
          this._router.navigate(['../'], {relativeTo: this._activatedRoute});

          // Mark for check
          this._changeDetectorRef.markForCheck();
        }
      )

      this._ngxsAction.pipe
      (
        takeUntil(this._unsubscribeAll),
        ofActionErrored(ContactAction.DeleteContact)
      ).subscribe(
        (value) => {
            this.isLoading =false
          // Mark for check
          this._changeDetectorRef.markForCheck();
        }
      )

    // Toggle the edit mode off
    this.toggleEditMode(false);
    
    // Mark for check
    this._changeDetectorRef.markForCheck();
  }

  updateSelectedContact(contact:ContactModel){
    // Open the drawer in case it is closed
    this._contactsListComponent.matDrawer.open();
    this.contact = contact;
    // Clear the emails and phoneNumbers form arrays
    (this.contactForm.get('emails') as UntypedFormArray).clear();
    (this.contactForm.get('phoneNumbers') as UntypedFormArray).clear();
    this.contactForm.patchValue(contact);

    // Setup the emails form array
    const emailFormGroups = [];
    if ( contact.emails.length > 0 )
    {
        // Iterate through them
        contact.emails.forEach((email) => {

            // Create an email form group
            emailFormGroups.push(
                
                this._formBuilder.group({
                    email: [email.email],
                    label: [email.label=="default"?{value:'default',disabled:true}:email.label]
                })
            );
        });
    }
    else
    {
      // Create an email form group
      emailFormGroups.push(
        this._formBuilder.group({
            email: ['',[Validators.required]],
            label: [{value:'default',disabled:true}]
        })
      );
    }
    // Add the email form groups to the emails form array
    emailFormGroups.forEach((emailFormGroup) => {
      (this.contactForm.get('emails') as UntypedFormArray).push(emailFormGroup);
    });
    
    // Setup the phone numbers form array
    const phoneNumbersFormGroups = [];

    if ( contact.phoneNumbers.length > 0 )
    {
      // Iterate through them
      contact.phoneNumbers.forEach((phoneNumber) => {

          // Create an email form group
          phoneNumbersFormGroups.push(
              this._formBuilder.group({
                  country    : [phoneNumber.country],
                  phoneNumber: [phoneNumber.phoneNumber],
                  label      : [phoneNumber.label=="whatsapp"?{value:'whatsapp',disabled:true}:phoneNumber.label]
              })
          );
      });
    }
    else
    {
      // Create a phone number form group
      phoneNumbersFormGroups.push(
        this._formBuilder.group({
            country    : ['cm'],
            phoneNumber: ['',Validators.required],
            label      : [{value:'whatsapp',disabled:true}]
        })
      );
    }

    // Add the phone numbers form groups to the phone numbers form array
    phoneNumbersFormGroups.forEach((phoneNumbersFormGroup) => {
      (this.contactForm.get('phoneNumbers') as UntypedFormArray).push(phoneNumbersFormGroup);
    });
    // Toggle the edit mode off
    this.toggleEditMode(false);

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

      // Dispose the overlays if they are still on the DOM
      if ( this._tagsPanelOverlayRef )
      {
          this._tagsPanelOverlayRef.dispose();
      }
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Close the drawer
   */
  closeDrawer(): Promise<MatDrawerToggleResult>
  {
      return this._contactsListComponent.matDrawer.close();
  }
  
   /**
     * Toggle edit mode
     *
     * @param editMode
     */
   toggleEditMode(editMode: boolean | null = null): void
   {
       if ( editMode === null )
       {
           this.editMode = !this.editMode;
       }
       else
       {
           this.editMode = editMode;
       }

       // Mark for check
       this._changeDetectorRef.markForCheck();
   }

   /**
   * update the contact
   */
   updateContact(): void
  {
      // Get the contact object
      
      const contact = FormUtils.removeNullAttribut(this.contactForm.getRawValue());

      // Go through the contact object and clear empty values
      contact.emails = contact.emails.filter(email => email.email);

      contact.phoneNumbers = contact.phoneNumbers.filter(phoneNumber => phoneNumber.phoneNumber);

      this.submitted=true;
      this._store.dispatch(new ContactAction.UpdateContact(contact,this.contact._id));
      
      
      // Update the contact on the server
      // this._contactsService.updateContact(contact.id, contact).subscribe(() => {

      //     // Toggle the edit mode off
      //     this.toggleEditMode(false);
      // });


  }

  /**
   * Delete the contact
   */
  deleteContact(): void
  {
      // Open the confirmation dialog
      const confirmation = this._fuseConfirmationService.open({
          title  : 'Annuler la modification',
          message: 'Voulez-vous vraiment supprimer ce contact? Cette action est irréversible!',
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
            this.isLoading=true;
            // Mark for check
            this._changeDetectorRef.markForCheck();         
            this._store.dispatch(new ContactAction.DeleteContact(this.contact._id)); 
          }
      });

  }

  /**
   * Upload avatar
   *
   * @param fileList
   */
  uploadAvatar(fileList: FileList): void
  {
      // Return if canceled
      if ( !fileList.length )
      {
          return;
      }

      const allowedTypes = ['image/jpeg', 'image/png'];
      const file = fileList[0];

      // Return if the file is not allowed
      if ( !allowedTypes.includes(file.type) )
      {
          return;
      }

      // Upload the avatar
      // this._contactsService.uploadAvatar(this.contact.id, file).subscribe();
  }

  /**
   * Remove the avatar
   */
  removeAvatar(): void
  {
      // Get the form control for 'avatar'
      const avatarFormControl = this.contactForm.get('avatar');

      // Set the avatar as null
      avatarFormControl.setValue(null);

      // Set the file input value as null
      this._avatarFileInput.nativeElement.value = null;

      // Update the contact
      this.contact.avatar = null;
  }

 
  /**
   * Add the email field
   */
  addEmailField(): void
  {
      // Create an empty email form group
      const emailFormGroup = this._formBuilder.group({
          email: [''],
          label: ['']
      });

      // Add the email form group to the emails form array
      (this.contactForm.get('emails') as UntypedFormArray).push(emailFormGroup);

      // Mark for check
      this._changeDetectorRef.markForCheck();
  }

  /**
   * Remove the email field
   *
   * @param index
   */
  removeEmailField(index: number): void
  {
      // Get form array for emails
      const emailsFormArray = this.contactForm.get('emails') as UntypedFormArray;

      // Remove the email field
      emailsFormArray.removeAt(index);

      // Mark for check
      this._changeDetectorRef.markForCheck();
  }

  /**
   * Get the email field
   *
   * @param index
   */
  getEmailField(index: number): any
  {
      // Get form array for emails
      const emailsFormArray = this.contactForm.get('emails') as UntypedFormArray;

      // Remove the email field
      return emailsFormArray.at(index);

  }

  /**
   * Add an empty phone number field
   */
  addPhoneNumberField(): void
  {
      // Create an empty phone number form group
      const phoneNumberFormGroup = this._formBuilder.group({
          country    : ['cm'],
          phoneNumber: [''],
          label      : ['']
      });

      // Add the phone number form group to the phoneNumbers form array
      (this.contactForm.get('phoneNumbers') as UntypedFormArray).push(phoneNumberFormGroup);

      // Mark for check
      this._changeDetectorRef.markForCheck();
  }

  /**
   * Remove the phone number field
   *
   * @param index
   */
  removePhoneNumberField(index: number): void
  {
      // Get form array for phone numbers
      const phoneNumbersFormArray = this.contactForm.get('phoneNumbers') as UntypedFormArray;

      // Remove the phone number field
      phoneNumbersFormArray.removeAt(index);

      // Mark for check
      this._changeDetectorRef.markForCheck();
  }

  /**
   * Get the phone number field
   *
   * @param index
   */
  getPhoneNumberField(index: number): any
  {
      // Get form array for phone numbers
      const phoneNumbersFormArray = this.contactForm.get('phoneNumbers') as UntypedFormArray;

      // Remove the phone number field
      return phoneNumbersFormArray.at(index);

  }

  /**
   * Get country info by iso code
   *
   * @param iso
   */
  getCountryByIso(iso: string): CountryModel
  {
      return this.countries.find(country => country.iso === iso);
  }

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
