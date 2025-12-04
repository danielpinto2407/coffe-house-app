import { Component, Input } from '@angular/core';
import { ProductModalService } from '../../core/services/product-modal.service';
import { Product } from '../../features/menu/models/product.model';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  imports: [CommonModule]
})
export class ProductCardComponent {

  @Input() product!: Product;

  constructor(
    private modal: ProductModalService,
    private cart: CartService
  ) {}

  openProduct(): void {
    this.modal.open(this.product);
  }

  addToCart(event: Event) {
    event.stopPropagation(); // no abrir modal

    this.cart.addProduct(this.product, 1);

    this.cart.open(); // abre overlay si quieres
  }
}
