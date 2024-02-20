import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { NewMessageComponent } from '../new-message/new-message.component';
import { UserProfileModel, UserProfileState } from 'app/shared/store/user-profile';
import { Select } from '@ngxs/store';
import { Observable } from 'rxjs';
import { GlobalState } from 'app/shared/store';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit{
  user:UserProfileModel=null;
  hasWhatsAppConnected:boolean=false;
  @Select(UserProfileState.selectStateData) loadUserProfil$:Observable<UserProfileModel>
  @Select(GlobalState.selectStateConnectedWhatsApp) hasWhatsAppConnected$:Observable<boolean>;

  constructor(
    private _matDialog: MatDialog, 
  ){}


  ngOnInit(): void {
    this.loadUserProfil$.subscribe((user)=>this.user=user)
    this.hasWhatsAppConnected$.subscribe((value)=>this.hasWhatsAppConnected=value)
  }

  
  newMessage()
  {
    // Open the dialog
    const dialogRef = this._matDialog.open(NewMessageComponent,
      {
        height: '100%',
        minWidth: '100%',
      }
      );
  }

  
}
