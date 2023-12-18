import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Renderer2, TemplateRef, ViewChild, ViewContainerRef, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Store, Actions } from '@ngxs/store';
import { CountryModel, CountryService } from 'app/shared/store';

import { Subject } from 'rxjs';
import { ListComponent } from '../list/list.component';
import { MatDrawerToggleResult } from '@angular/material/sidenav';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';

@Component({
  selector: 'app-import',
  templateUrl: './import.component.html',
  styleUrls: ['./import.component.scss'],
  encapsulation  : ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportComponent {
  @ViewChild('avatarFileInput') private _avatarFileInput: ElementRef;
  @ViewChild('tagsPanel') private _tagsPanel: TemplateRef<any>;
  @ViewChild('tagsPanelOrigin') private _tagsPanelOrigin: ElementRef;
  submitted = false
  editMode: boolean = false;
  
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
  
  /**
     * On init
     */
  ngOnInit(): void
  {
    // Open the drawer
    this._contactsListComponent.matDrawer.open();   
    
    // Mark for check
    this._changeDetectorRef.markForCheck();
  }

  /**
   * Close the drawer
   */
  closeDrawer(): Promise<MatDrawerToggleResult>
  {
      return this._contactsListComponent.matDrawer.close();
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
}
