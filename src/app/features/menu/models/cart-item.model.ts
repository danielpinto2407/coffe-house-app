import { Product } from '../models/product.model';
import { ProductAddition } from './product-addition.model';

export interface CartItem {
  product: Product;
  qty: number;
  selectedAdditions?: ProductAddition[]; // ✅ NUEVO: Adiciones opcionales
  finalPrice?: number; // ✅ NUEVO: Precio con adiciones (si aplica)
}
