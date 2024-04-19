import { Component, ViewEncapsulation } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
  selector: 'app-sign-inup',
  templateUrl: './sign-inup.component.html',
  styleUrls: ['./sign-inup.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations   : fuseAnimations
})
export class SignInupComponent {
  

  /**
   * Constructor
   */
  constructor(
      private _formBuilder: UntypedFormBuilder,
      private authService:AuthService
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
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Sign in
   */
  signIn(): void
  { 
    this.authService.authLogin(true);
  }

  /**
   * Sign Up
   */
  signUp():void
  {
    this.authService.authRegister(true)
  }
}
