import { Injectable } from '@angular/core';
import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment';
import { Socket } from 'ngx-socket-io';
import { combineLatest } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class WebsocketManagerService extends Socket {

  userInfos = null;
  constructor(
    private userService:UserService
  ) {
    super({ url: environment.apiUrl, options: {} });

    combineLatest([this.fromEvent('connexion'),this.userService.user$]).subscribe(([_,value])=>{
      if(value) this.emit('connexion', {email: value.email});
    })
   
    

    // this.on('disconnect', reason => { 
    //   if(reason === 'io server disconnect') {
    //     //you should renew token or do another important things before reconnecting
    //     console.log("reconnectionn WSQ")
    //     this.emit('connexion', {email: this.userInfos.email});
    //   }
    // });


  }
}
