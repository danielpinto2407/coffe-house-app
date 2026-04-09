import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({ 
  selector: 'app-mobile-menu',
  standalone: true,
  templateUrl: './mobile-menu.component.html',
  imports: [CommonModule],
})
export class MobileMenuComponent {

  @Input() isOpen = false;
  @Input() isLoggedIn = false;

  @Output() closed = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  close() {
    this.closed.emit();
  }
}
