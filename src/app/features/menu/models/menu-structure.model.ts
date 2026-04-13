import { Category } from './category.model';
import { Subcategory } from './subcategory.model';
import { Product } from './product.model';

/**
 * Menú completo estructurado: Categoría → [Productos directos] + [Subcategoría → Productos]
 * Estructura jerárquica flexible para renderizar en template
 */
export interface MenuStructure extends Category {
  products?: Product[];              // ✅ Productos directos de la categoría (sin subcategoría)
  subcategories: SubcategoryWithProducts[];
}

/**
 * Subcategoría con sus productos incluidos
 */
export interface SubcategoryWithProducts extends Subcategory {
  products: Product[];
}

/**
 * Formato individual de un producto para búsqueda
 */
export interface SearchableProduct extends Product {
  categoryName: string;
  subcategoryName: string;
}
