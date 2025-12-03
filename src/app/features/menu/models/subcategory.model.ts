export interface Subcategory {
  id: number;             // Ej: 10 = Bebidas Calientes, 11 = Bebidas Frías
  categoryId: number;     // Relación con Category.id
  name: string;
  order: number;
  description?: string; // Descripción opcional
}
