import { Component, ChangeDetectionStrategy, inject, signal, computed, DestroyRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { ProductModalService } from '../../core/services/product-modal.service';
import { CartService } from '../../core/services/cart-service';
import { ProductAdditionsService } from '../../core/services/product-additions.service';
import { Product } from '../../features/menu/models/product.model';
import { ProductAddition } from '../../features/menu/models/product-addition.model';
import { ProductAdditionsSelectorComponent } from './product-additions-selector.component';
import { BodyScrollLockService } from '../../core/services/body-scroll-lock.service';
import { environment } from '../../../environments/environment';

@Component({
  standalone: true,
  selector: 'app-product-modal',
  templateUrl: './product-modal.component.html',
  styleUrl: './product-modal.component.css',
  imports: [CommonModule, FormsModule, ProductAdditionsSelectorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductModalComponent implements OnDestroy {
  protected readonly modal = inject(ProductModalService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly bodyScrollLock = inject(BodyScrollLockService);
  private readonly cart = inject(CartService);
  private readonly additionsService = inject(ProductAdditionsService);

  private readonly currentProduct = toSignal(this.modal.product$);
  private readonly selectedAdditions = signal<ProductAddition[]>([]);

  constructor() {
    this.modal.product$
      .pipe(
        map((product) => !!product),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((isOpen) => {
        if (isOpen) {
          this.bodyScrollLock.lock('product-modal');
          return;
        }
        this.bodyScrollLock.unlock('product-modal');
      });
  }


  protected readonly finalPrice = computed(() => {
    const product = this.currentProduct();
    if (!product) return 0;
    return this.additionsService.calculateFinalPrice(product.price, this.selectedAdditions());
  });

  protected readonly hasPriceIncrease = computed(() => {
    const product = this.currentProduct();
    return !!product && this.finalPrice() > product.price;
  });

  protected readonly modalImageSrc = computed(() => {
    const product = this.currentProduct();
    if (!product?.image) {
      return 'assets/img/logo.png';
    }

    if (product.image.startsWith('http')) {
      return product.image;
    }

    return `${environment.supabase.url}/storage/v1/object/public/menu/products/${product.image}`;
  });

  onModalImageError(event: Event): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) {
      return;
    }

    if (img.src.includes('assets/img/logo.png')) {
      return;
    }

    img.src = 'assets/img/logo.png';
  }

  onAdditionsChanged(additions: ProductAddition[]): void {
    this.selectedAdditions.set(additions);
  }

  ngOnDestroy(): void {
    this.bodyScrollLock.unlock('product-modal');
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
   * 0 Retorna la seleccin de texto actual (si existe)
   * Usado para no cerrar modal mientras el usuario selecciona texto
   */
  getSelection(): Selection | null {
    return (typeof globalThis !== 'undefined' && globalThis.getSelection) ? globalThis.getSelection() : null;
  }
}
