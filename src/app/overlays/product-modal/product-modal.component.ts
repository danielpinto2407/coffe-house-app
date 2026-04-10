import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductModalService } from '../../core/services/product-modal.service';
import { CartService } from '../../core/services/cart-service';
import { Product } from '../../features/menu/models/product.model';

@Component({
  standalone: true,
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.css',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductModalComponent {
  protected readonly modal = inject(ProductModalService);
  private readonly cart = inject(CartService);

  onAddToCart(product: Product | null | undefined): void {
    if (!product?.id) {
      return;
    }

    this.cart.addProduct(product, 1);
    this.cart.open();
    this.modal.close();
  }

  onClose(): void {
    this.modal.close();
  }

  /**
   * ✅ Retorna la selección de texto actual (si existe)
   * Usado para no cerrar modal mientras el usuario selecciona texto
   */
  getSelection(): Selection | null {
    return window.getSelection?.() || null;
  }
}
