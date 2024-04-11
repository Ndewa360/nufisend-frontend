import { Injectable } from '@angular/core';
// import { ToastrService } from 'ngx-toastr';
import { BehaviorSubject, of } from 'rxjs';
import { KeycloakService } from 'keycloak-angular';
import { KeycloakProfile } from 'keycloak-js';
import { environment } from 'environments/environment';
// import { WebsocketManagerService } from 'app/shared/services/websocket-manager/websocket-manager.service';
// import { Socket } from 'ngx-socket-io';

@Injectable({
    providedIn:'root'
})
export class AuthService {
 
  currentUser: BehaviorSubject<KeycloakProfile> = new BehaviorSubject<KeycloakProfile>(null); 

  constructor( private readonly keycloak: KeycloakService
    // ,private socket: WebsocketManagerService
    ) 
  {
    this.checkAuthStatus()
  }

  async checkAuthStatus()
  {
    if(this.keycloak.isLoggedIn())
    {
        this.currentUser.next(await this.keycloak.loadUserProfile())
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
  authLogin(isFirstLogin=false) {
    if(isFirstLogin) return this.keycloak.login({redirectUri:`${environment.url}/dashboard`});    
    return this.keycloak.login();    
  }

  authRegister(isFirstRegistration=false)
  {
    if(isFirstRegistration) return this.keycloak.register({redirectUri:`${environment.url}/dashboard`})
    return this.keycloak.register()
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
