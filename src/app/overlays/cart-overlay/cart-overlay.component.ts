import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';

@Component({
  selector: 'app-cart-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-overlay.component.html',
})
export class CartOverlayComponent {

  isLoggedIn = false;     // <-- requerido por tu header
  isMenuOpen = false;     // <-- requerido por tu header

  constructor(public cart: CartService) {}

  close() {
    this.cart.close();
  }

  // 🔥 Ítems en el carrito
  get cartCount(): number {
    return this.cart.getItemsSnapshot().length;
  }

  // 🔥 Subtotal del carrito
  get subtotal(): number {
    const items = this.cart.getItemsSnapshot();
    return items.reduce((acc: number, it: { product: { price: number }; qty: number }) => 
      acc + it.product.price * it.qty, 0);
  }

  logout() {
    this.isLoggedIn = false;
  }
}
