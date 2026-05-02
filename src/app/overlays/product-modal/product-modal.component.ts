import { Component, ChangeDetectionStrategy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ProductModalService } from '../../core/services/product-modal.service';
import { CartService } from '../../core/services/cart-service';
import { ProductAdditionsService } from '../../core/services/product-additions.service';
import { Product } from '../../features/menu/models/product.model';
import { ProductAddition } from '../../features/menu/models/product-addition.model';
import { ProductAdditionsSelectorComponent } from './product-additions-selector.component';

@Component({
  standalone: true,
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.css',
  imports: [CommonModule, ProductAdditionsSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductModalComponent {
  protected readonly modal = inject(ProductModalService);
  private readonly cart = inject(CartService);
  private readonly additionsService = inject(ProductAdditionsService);

  private readonly currentProduct = toSignal(this.modal.product$);
  private readonly selectedAdditions = signal<ProductAddition[]>([]);

  protected readonly finalPrice = computed(() => {
    const product = this.currentProduct();
    if (!product) return 0;
    return this.additionsService.calculateFinalPrice(product.price, this.selectedAdditions());
  });

  protected readonly hasPriceIncrease = computed(() => {
    const product = this.currentProduct();
    return !!product && this.finalPrice() > product.price;
  });

  onAdditionsChanged(additions: ProductAddition[]): void {
    this.selectedAdditions.set(additions);
  }

  onAddToCart(product: Product | null | undefined): void {
    if (!product?.id) return;
    this.cart.addProduct(product, 1, this.selectedAdditions(), this.finalPrice());
    this.cart.open();
    this.modal.close();
    this.selectedAdditions.set([]);
  }

  onClose(): void {
    this.modal.close();
    this.selectedAdditions.set([]);
  }

  /**
   * ✅ Retorna la selección de texto actual (si existe)
   * Usado para no cerrar modal mientras el usuario selecciona texto
   */
  getSelection(): Selection | null {
    return window.getSelection?.() || null;
  }
}
