export interface Product {
  id: number;
  categoryId?: number;      // ✅ Nuevo: relación directa a categoría (opcional)
  subcategoryId?: number;   // ✅ Ahora opcional - permite productos sin subcategoría
  name: string;
  price: number;
  image?: string;
  description?: string;
  order: number;
  active?: boolean;  // Para ocultar/mostrar productos en el menú
}
