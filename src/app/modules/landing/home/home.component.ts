import { Component, OnInit, ViewEncapsulation } from '@angular/core';

declare const AOS: any;

@Component({
    selector     : 'landing-home',
    templateUrl  : './home.component.html',
    styleUrls: ['./home.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class LandingHomeComponent implements OnInit
{
    /**
     * Constructor
     */
    constructor() { }
    ngOnInit(): void {
        AOS.init();
        console.log("AOS ",AOS)
        document.addEventListener("scroll", this.onScroll);
    }



     // Get the navbar
    onScroll(event) {
		/*Apply classes for slide in bar*/
        const header = document.getElementById('fixed-header');
        if (window.scrollY > 0) {
            // header.classList.remove('hidden');
        } else {
            // header.classList.add('hidden');
        }
	}
}
