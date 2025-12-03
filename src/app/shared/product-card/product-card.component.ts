import { Component, Input } from '@angular/core';
import { ProductModalService } from '../../core/services/product-modal.service';
import { Product } from '../../features/menu/models/product.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  imports: [CommonModule]
})
export class ProductCardComponent {
  @Input() product!: Product;

  constructor(private modal: ProductModalService) {}

  openProduct(): void {
    this.modal.open({
      id: this.product.id,
      name: this.product.name,
      price: this.product.price,
      description: this.product.description,
      image: this.product.image,
    });
  }

  addToCart(event: Event): void {
    event.stopPropagation();
    console.log('Agregar al carrito:', this.product);
  }
}
