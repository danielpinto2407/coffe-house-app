import { Product } from './product.model';
import { ProductAddition } from './product-addition.model';

/**
 * CartItemWithAdditions - Extiende CartItem con soporte para adiciones personalizadas
 * Incluye el precio final calculado con las adiciones
 */
export interface CartItemWithAdditions {
  product: Product;
  qty: number;
  selectedAdditions: ProductAddition[]; // ✅ NUEVO: Adiciones seleccionadas
  finalPrice: number; // ✅ NUEVO: Precio base + adiciones
}
