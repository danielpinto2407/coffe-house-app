import { Component, ChangeDetectionStrategy, inject, DestroyRef, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged } from 'rxjs/operators';
import { CartService } from '../../core/services/cart-service';
import { OrderMessageService } from '../../core/services/order-message.service';
import { WHATSAPP_ORDER_PHONE } from '../../core/constants/whatsapp.constants';
import { Order } from '@features/orders/models/order.model';
import { NotificationService } from '../../core/services/notification.service';
import { BodyScrollLockService } from '../../core/services/body-scroll-lock.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cart-overlay',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-overlay.component.html',
  styleUrl: './cart-overlay.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartOverlayComponent implements OnInit, OnDestroy {
    private readonly destroyRef = inject(DestroyRef);
    private readonly bodyScrollLock = inject(BodyScrollLockService);
    private readonly notificationService = inject(NotificationService);
    protected readonly cart = inject(CartService);
    protected readonly orderMessage = inject(OrderMessageService);

    constructor() {
      this.cart.open$
        .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
        .subscribe((isOpen) => {
          if (isOpen) {
            this.bodyScrollLock.lock('cart-overlay');
            return;
          }
          this.bodyScrollLock.unlock('cart-overlay');
        });
    }

    ngOnInit(): void {
      // Detectar regreso de WhatsApp
      if (globalThis.window?.localStorage) {
        if (globalThis.window.localStorage.getItem('order_pending') === '1') {
          // Mostrar notificación y limpiar flag
          this.notificationService.success('¡Pedido realizado exitosamente!');
          globalThis.window.localStorage.removeItem('order_pending');
        }
      }
    }

    ngOnDestroy(): void {
      this.bodyScrollLock.unlock('cart-overlay');
    }

  // Campos para el formulario de pedido
  public customerName = '';
  public observation = '';
  public nameTouched = false;

  resolveProductImage(image: string | undefined): string {
    if (!image) {
      return 'assets/img/logo.png';
    }

    if (image.startsWith('http')) {
      return image;
    }

    return `${environment.supabase.url}/storage/v1/object/public/menu/products/${image}`;
  }

  onCartImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }

    if (img.src.includes('assets/img/logo.png')) {
      return;
    }

    img.src = 'assets/img/logo.png';
  }

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
    this.nameTouched = true;
    if (!this.customerName.trim()) return;
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
      customerName: this.customerName.trim(),
      observation: this.observation.trim(),
    };

    // Construir mensaje amigable, solo con nombre y observación del formulario
    const message = this.orderMessage.buildWhatsAppMessage(order);

    // Codificar mensaje para URL
    const encodedMsg = encodeURIComponent(message);
    const phone = WHATSAPP_ORDER_PHONE;
    const url = `https://wa.me/${phone}?text=${encodedMsg}`;

    // SSR-safe: solo abrir WhatsApp si window está disponible
    if (globalThis.window !== undefined) {
      globalThis.window.open(url, '_blank');
    }
    // Marcar pedido pendiente para mostrar notificación al volver
    if (globalThis.window?.localStorage) {
      globalThis.window.localStorage.setItem('order_pending', '1');
    }
    // Limpiar carrito y cerrar modal
    this.cart.clear();
    this.cart.close();
    // Limpiar campos
    this.customerName = '';
    this.observation = '';
    this.nameTouched = false;
  }
}
