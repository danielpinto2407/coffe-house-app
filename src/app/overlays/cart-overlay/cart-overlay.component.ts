import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';
import { OrderMessageService } from '../../core/services/order-message.service';
import { WHATSAPP_ORDER_PHONE } from '../../core/constants/whatsapp.constants';
import { Order } from '@features/orders/models/order.model';

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

  protected readonly orderMessage = inject(OrderMessageService);

  onRemove(productId: number): void {
    this.cart.removeProduct(productId);
  }

  onDecrease(productId: number): void {
    this.cart.decrease(productId, 1);
  }

  onIncrease(productId: number): void {
    this.cart.increase(productId, 1);
  }

  /**
   * Envía el pedido por WhatsApp usando el OrderMessageService
   * El usuario completa nombre y observaciones en WhatsApp antes de enviar
   */
  onCheckout(): void {
    const items = this.cart.getItemsSnapshot();
    if (!items || items.length === 0) {
      return;
    }

    // Calcular total usando lógica del CartService
    const total = items.reduce((acc, it) => {
      const itemPrice = it.finalPrice ?? (Number(it.product.price || 0));
      return acc + (itemPrice * it.qty);
    }, 0);

    // Crear Order temporal (sin id ni fecha, solo para mensaje)
    const order: Order = {
      id: '',
      items,
      total,
      createdAt: new Date(),
    };

    // Construir mensaje amigable
    const message = this.orderMessage.buildWhatsAppMessage(order);

    // Codificar mensaje para URL
    const encodedMsg = encodeURIComponent(message);
    const phone = WHATSAPP_ORDER_PHONE;
    const url = `https://wa.me/${phone}?text=${encodedMsg}`;

    // SSR-safe: solo abrir WhatsApp si window está disponible
    if (globalThis.window !== undefined) {
      globalThis.window.open(url, '_blank');
    }
  }
}
