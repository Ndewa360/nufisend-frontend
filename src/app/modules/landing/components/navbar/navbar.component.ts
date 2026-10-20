import { Component, HostListener, OnInit, ViewEncapsulation } from '@angular/core';

@Component({
    selector     : 'app-navbar',
    templateUrl  : './navbar.component.html',
    styleUrls    : ['./navbar.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class NavbarComponent implements OnInit
{
    showMenu = false;
    scrolled = false;

    ngOnInit(): void
    {
        this.scrolled = window.scrollY > 8;
    }

    @HostListener('window:scroll')
    onWindowScroll(): void
    {
        this.scrolled = window.scrollY > 8;
    }

    @HostListener('window:resize')
    onWindowResize(): void
    {
        if ( window.innerWidth >= 1280 )
        {
            this.showMenu = false;
        }
    }

    toggleMenu(): void
    {
        this.showMenu = !this.showMenu;
    }

    closeMenu(): void
    {
        this.showMenu = false;
    }
}
