export interface Product {
  id: number;
  categoryId?: number;           // ✅ Relación directa a categoría (opcional)
  subcategoryId?: number | null; // ✅ Opcional - permite productos sin subcategoría (null = directo)
  name: string;
  price: number;
  image?: string;
  description?: string;
  order: number;
  active?: boolean;              // Para ocultar/mostrar productos en el menú
}
