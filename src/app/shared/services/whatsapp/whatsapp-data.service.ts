import { Injectable } from '@angular/core';
import { Store } from '@ngxs/store';
import { WhatsappContact } from 'app/shared/store';
import { BehaviorSubject } from 'rxjs';
import { WebsocketManagerService } from '../websocket-manager/websocket-manager.service';
// import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class WhatsappDataService {
  whatsappProfil:BehaviorSubject<Object>=new BehaviorSubject<Object>({});
  whatsappContactList:BehaviorSubject<WhatsappContact[]>=new BehaviorSubject<WhatsappContact[]>([]);
  constructor(private socket: WebsocketManagerService,private store:Store) {
    this.handleWhatsappInfo()
  }

  handleWhatsappInfo()
  {
    this.socket.on('info',(value)=>{
      this.filterValidContact(value.contacts)
    })
  }
  filterValidContact(contactList:WhatsappContact[])
  {
    let me:WhatsappContact=null;
    this.whatsappContactList.next(contactList
    //   .filter((contact:WhatsappContact)=> {
    //   if(contact.isMe) me=contact;
    //   return !contact.isBlocked && !contact.isGroup && !contact.isMe && contact.isMyContact && contact.isWAContact && contact.isUser
    // })
    )
    console.log("Me ",me)

  }
}
