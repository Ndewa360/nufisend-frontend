import { Injectable } from '@angular/core';
// import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, of } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';


@Injectable({
    providedIn:'root'
})
export class AuthService {
 
  currentUser: BehaviorSubject<KeycloakProfile> = new BehaviorSubject<KeycloakProfile>(null); 

  constructor( private readonly keycloak: KeycloakService) 
  {
    this.checkAuthStatus()
  }

  async checkAuthStatus()
  {
    if(this.keycloak.isLoggedIn())
    {
        this.currentUser.next(await this.keycloak.loadUserProfile())
        console.log("User",await this.keycloak.loadUserProfile())
    }
  }
  public getAuthStatus():boolean
  {
    return this.keycloak.isLoggedIn()
  }
  public authUserInformations():KeycloakProfile
  {
    return this.getAuthStatus()?this.currentUser.getValue():null
  }

  public redirectToProfile()
  {
    this.keycloak.getKeycloakInstance().accountManagement()
  }

  getRoles():string[]
  {
    return this.getAuthStatus()?this.keycloak.getUserRoles():null;
  }
 
  // Login into your account
  authLogin() {
    this.keycloak.login();    
  }
 
  logOut():Promise<any>
  {
    return this.keycloak.logout().then(()=>{
        this.currentUser.next(null)
    });
  }

  //To clear
  unlockSession(arg0: { email: string; password: any; }) {
    return of(true)
}
}
