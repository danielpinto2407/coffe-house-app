/**
 * ProductAddition - Representa cada adición disponible para un producto
 * Ejemplo: Leche, Proteína Whey, Granola, etc.
 */
export interface ProductAddition {
  id: number;
  name: string;
  price: number;
  order: number;
}
