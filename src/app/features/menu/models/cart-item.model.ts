import { Product } from '../models/product.model';

export interface CartItem {
  product: Product;
  qty: number;
}
