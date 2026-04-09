import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';

@Component({
  selector: 'app-cart-overlay',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-overlay.component.html',
  styleUrl: './cart-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartOverlayComponent {
  protected readonly cart = inject(CartService);

  onRemove(productId: number): void {
    this.cart.removeProduct(productId);
  }

  onDecrease(productId: number): void {
    this.cart.decrease(productId, 1);
  }

  onIncrease(productId: number): void {
    this.cart.increase(productId, 1);
  }

  onCheckout(): void {
    const payload = this.cart.buildCheckoutPayload();
    
    // ✅ Validar que el carrito no esté vacío
    if (!payload || payload.length === 0) {
      console.warn('Cannot checkout with empty cart');
      return;
    }

    const items = this.cart.getItemsSnapshot();
    const total = items.reduce((acc, it) => acc + (Number(it.product.price || 0) * it.qty), 0);

    console.log('📋 Checkout initiated:', {
      itemCount: payload.length,
      total,
      timestamp: new Date().toISOString(),
    });

    // ✅ TODO: Integrar con servicio de pagos
    // 1. Validar items con ProductValidator
    // 2. Enviar a backend para procesar pago
    // 3. Mostrar loading state
    // 4. Manejar respuesta y errores
    // 5. Limpiar carrito después de éxito
  }
}
