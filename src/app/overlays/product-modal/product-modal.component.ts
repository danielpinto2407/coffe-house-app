import { Component } from '@angular/core';
import { ProductModalService } from '../../core/services/product-modal.service';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';

@Component({
  standalone: true,
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  imports: [CommonModule]
})
export class ProductModalComponent {

  constructor(
    public modal: ProductModalService,
    private cart: CartService
  ) {}

  addFromModal(product: any) {
    if (!product) return;

    this.cart.addProduct(product, 1);

    // Opcional: abre el overlay del carrito
    this.cart.open();

    // Cierra el modal
    this.modal.close();
  }
}
