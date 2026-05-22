// Modelo de Pedido para Coffee House App
import { CartItem } from '../../menu/models/cart-item.model';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  createdAt: Date;
  // Puedes agregar más campos según necesidades futuras
}
