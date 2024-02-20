//dropdown.directive.ts
import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appDropdown]'
})
export class DropdownDirective {
  @Output() isMenuOpen = new EventEmitter<boolean>();
  isOpen: boolean = false;

  constructor() { }

  @HostListener('click') toggleMenu() {
    this.isOpen = !this.isOpen;
    this.isMenuOpen.emit(this.isOpen);
    console.log(`Menu status changed. Menu is now ${this.isOpen ? 'Open' : 'Closed'}`)
  }
}