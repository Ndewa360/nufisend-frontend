import { Component, OnInit } from '@angular/core';
import { AuthService } from './core/auth/auth.service';

@Component({
    selector   : 'app-root',
    templateUrl: './app.component.html',
    styleUrls  : ['./app.component.scss']
})
export class AppComponent implements OnInit
{
    /**
     * Constructor
     */
    constructor( private authService:AuthService)
    {
        // authService.checkAuthStatus()
    }
    ngOnInit(): void {
       
    }
}
