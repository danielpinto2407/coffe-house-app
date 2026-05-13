import { Component, input, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { MenuStructure } from '../../models/menu-structure.model';
import { ProductCardComponent } from '../../../../shared/product-card/product-card.component';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [ProductCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.css',
})
export class CategoryCardComponent {
  category = input.required<MenuStructure>();
  isExpanded = signal(false);

  // Computed: Obtener solo los productos directos de la categoría (sin subcategorías)
  protected readonly directProducts = computed(() => {
    const cat = this.category();
    return cat.products ?? [];
  });

  // Computed: Verificar si hay subcategorías con productos
  protected readonly hasSubcategoryProducts = computed(() => {
    const cat = this.category();
    return cat.subcategories.some(sub => sub.products.length > 0);
  });

  // Computed: Verificar si hay productos totales
  protected readonly hasProducts = computed(() => {
    return this.directProducts().length > 0 || this.hasSubcategoryProducts();
  });

  // Computed: Obtener imagen de la categoría o default si no existe
  protected readonly categoryImage = computed(() => {
    const cat = this.category();
    return cat.image?.trim() ? cat.image : 'assets/img/logo.png';
  });

  toggleExpand(): void {
    this.isExpanded.update((val) => !val);
  }
}
