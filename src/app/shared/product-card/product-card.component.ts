import { Component, Input, ChangeDetectionStrategy, inject, input, computed } from '@angular/core';
import { ProductModalService } from '../../core/services/product-modal.service';
import { Product } from '../../features/menu/models/product.model';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart-service';
import { ImageOptimizationService } from '../../core/services/image-optimization.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-card',
  standalone: true,
  templateUrl: './product-card.component.html',
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {

  // ✅ Usar signal input en lugar de @Input para mejor reactivity
  product = input.required<Product>();

  private readonly modal = inject(ProductModalService);
  protected readonly cart = inject(CartService);
  private readonly imageOpt = inject(ImageOptimizationService);

  // ✅ Computed signal para genera URL optimizada
  protected readonly optimizedImage = computed(() => {
    const prod = this.product();
    if (!prod?.image) {
      return {
        src: 'assets/img/logo.png',
        srcset: '',
        sizes: '',
      };
    }

    // Si la imagen es URL externa (ej: de Supabase)
    if (prod.image.startsWith('http')) {
      return {
        src: prod.image,
        srcset: `${prod.image}?w=200 200w, ${prod.image}?w=400 400w`,
        sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
      };
    }

    // Si es archivo local en Supabase Storage
    const supabaseUrl = `${environment.supabase.url}/storage/v1/object/public/menu/products/${prod.image}`;
    return {
      src: supabaseUrl,
      srcset: `${supabaseUrl}?w=200 200w, ${supabaseUrl}?w=400 400w, ${supabaseUrl}?w=600 600w`,
      sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    };
  });

  openProduct(): void {
    const prod = this.product();
    if (!prod?.id) {
      return;
    }
    this.modal.open(prod);
  }

  addToCart(event: Event): void {
    event.stopPropagation(); // no abrir modal

    const prod = this.product();
    if (!prod?.id) {
      return;
    }

    this.cart.addProduct(prod, 1);
    this.cart.open(); // abre overlay si quieres
  }
}
