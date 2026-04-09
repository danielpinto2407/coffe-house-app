export interface Category {
  id: number;             // Ej: 1 = Bebidas, 2 = Postres
  name: string;           // Nombre visible
  order: number;          // Orden en pantalla
  description?: string; // Descripción opcional
}
