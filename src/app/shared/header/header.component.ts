import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MobileMenuComponent } from '../../overlays/mobile-menu/mobile-menu.component';
import { CartService } from '../../core/services/cart-service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, MobileMenuComponent],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {

  isMenuOpen = false;
  isLoggedIn = false;

  cartCount = 0;

  constructor(public cart: CartService) {}

  ngOnInit() {
    this.cart.count$.subscribe(count => {
      this.cartCount = count;
    });
  }

  openMenu() {
    this.isMenuOpen = true;
  }

  closeMenu() {
    this.isMenuOpen = false;
  }

  logout() {
    this.isLoggedIn = false;
    this.closeMenu();
  }

  // 👇 Cierra el menú móvil cuando la pantalla se agranda
  @HostListener('window:resize')
  onResize() {
    if (window.innerWidth >= 768 && this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
}
