import { Component, Input, ChangeDetectionStrategy, inject } from '@angular/core';
import { ProductModalService } from '../../core/services/product-modal.service';
import { Product } from '../../features/menu/models/product.model';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {

  @Input() product!: Product;

  private readonly modal = inject(ProductModalService);
  protected readonly cart = inject(CartService);

  openProduct(): void {
    if (!this.product?.id) {
      console.error('ProductCard: producto inválido');
      return;
    }
    this.modal.open(this.product);
  }

  addToCart(event: Event): void {
    event.stopPropagation(); // no abrir modal

    if (!this.product?.id) {
      console.error('ProductCard: producto inválido');
      return;
    }

    this.cart.addProduct(this.product, 1);
    this.cart.open(); // abre overlay si quieres
  }
}
