import { ProductAdditionsConfig } from '../models/product-addition.model';

/**
 * Mock data para adiciones de productos
 * Define qué adiciones están disponibles para cada producto
 */
export const PRODUCT_ADDITIONS_CONFIG: ProductAdditionsConfig[] = [
  // Batido de Fresa (id: 130)
  {
    productId: 130,
    additions: [
      { id: 1001, name: 'Agua', price: 0, order: 1 },
      { id: 1002, name: 'Leche', price: 500, order: 2 },
      { id: 1003, name: 'Yogurt Griego', price: 1000, order: 3 },
      { id: 1004, name: 'Leche de Almendras', price: 800, order: 4 },
      { id: 2001, name: 'Proteína Whey', price: 2000, order: 5 },
      { id: 2002, name: 'Colágeno', price: 1500, order: 6 },
      { id: 3001, name: 'Granola', price: 500, order: 7 },
      { id: 3002, name: 'Choco Chips', price: 400, order: 8 },
      { id: 3003, name: 'Coco Rallado', price: 300, order: 9 },
    ],
  },

  // Batido de Mango (id: 131)
  {
    productId: 131,
    additions: [
      { id: 1001, name: 'Agua', price: 0, order: 1 },
      { id: 1002, name: 'Leche', price: 500, order: 2 },
      { id: 1003, name: 'Yogurt Griego', price: 1000, order: 3 },
      { id: 1004, name: 'Leche de Almendras', price: 800, order: 4 },
      { id: 2001, name: 'Proteína Whey', price: 2000, order: 5 },
      { id: 2002, name: 'Colágeno', price: 1500, order: 6 },
      { id: 3001, name: 'Granola', price: 500, order: 7 },
      { id: 3002, name: 'Choco Chips', price: 400, order: 8 },
    ],
  },

  // Batido de Banano (id: 132)
  {
    productId: 132,
    additions: [
      { id: 1001, name: 'Agua', price: 0, order: 1 },
      { id: 1002, name: 'Leche', price: 500, order: 2 },
      { id: 1003, name: 'Yogurt Griego', price: 1000, order: 3 },
      { id: 1004, name: 'Leche de Almendras', price: 800, order: 4 },
      { id: 2001, name: 'Proteína Whey', price: 2000, order: 5 },
      { id: 3001, name: 'Granola', price: 500, order: 6 },
    ],
  },

  // Batido Verde (id: 133)
  {
    productId: 133,
    additions: [
      { id: 1001, name: 'Agua', price: 0, order: 1 },
      { id: 1002, name: 'Leche', price: 500, order: 2 },
      { id: 1003, name: 'Yogurt Griego', price: 1000, order: 3 },
      { id: 2001, name: 'Proteína Whey', price: 2000, order: 4 },
      { id: 2002, name: 'Colágeno', price: 1500, order: 5 },
      { id: 3001, name: 'Granola', price: 500, order: 6 },
    ],
  },

  // Batido de Frutos Rojos (id: 134)
  {
    productId: 134,
    additions: [
      { id: 1001, name: 'Agua', price: 0, order: 1 },
      { id: 1002, name: 'Leche', price: 500, order: 2 },
      { id: 1003, name: 'Yogurt Griego', price: 1000, order: 3 },
      { id: 2001, name: 'Proteína Whey', price: 2000, order: 4 },
      { id: 3001, name: 'Granola', price: 500, order: 5 },
      { id: 3002, name: 'Choco Chips', price: 400, order: 6 },
    ],
  },

  // Batido Tropical (id: 135)
  {
    productId: 135,
    additions: [
      { id: 1001, name: 'Agua', price: 0, order: 1 },
      { id: 1002, name: 'Leche', price: 500, order: 2 },
      { id: 1003, name: 'Yogurt Griego', price: 1000, order: 3 },
      { id: 1004, name: 'Leche de Almendras', price: 800, order: 4 },
      { id: 2001, name: 'Proteína Whey', price: 2000, order: 5 },
      { id: 3001, name: 'Granola', price: 500, order: 6 },
      { id: 3003, name: 'Coco Rallado', price: 300, order: 7 },
    ],
  },
];
