export interface Product {
  id: number;
  subcategoryId: number;  // Relación con Subcategory.id
  name: string;
  price: number;
  image?: string;
  description?: string;
  order: number;
  active?: boolean;  // Para ocultar/mostrar productos en el menú
}
