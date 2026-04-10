/**
 * ✅ Validadores centralizados para modelos
 * Asegura type safety en runtime
 */

import { Product } from '../../features/menu/models/product.model';
import { CartItem } from '../../features/menu/models/cart-item.model';

/**
 * Validador de Product
 * Define estructura y restricciones
 */
export function validateProduct(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'number' &&
    data.id > 0 &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    typeof data.price === 'number' &&
    data.price >= 0 &&
    typeof data.subcategoryId === 'number' &&
    data.subcategoryId > 0 &&
    typeof data.order === 'number' &&
    data.order >= 0 &&
    (typeof data.description === 'string' || data.description === undefined) &&
    (typeof data.image === 'string' || data.image === undefined)
  );
}

/**
 * Validador de CartItem
 */
export function validateCartItem(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    validateProduct(data.product) &&
    typeof data.qty === 'number' &&
    data.qty > 0 &&
    Number.isInteger(data.qty)
  );
}

/**
 * ✅ ProductValidator - Clase estática con métodos helper
 * (Consolidada para evitar duplicación de código)
 */
export class ProductValidator {
  static validate(value: any): value is Product {
    return validateProduct(value);
  }

  static validateOrThrow(value: any, context = 'Product'): Product {
    if (!this.validate(value)) {
      throw new Error(`${context} validation failed: ${JSON.stringify(value)}`);
    }
    return value;
  }

  static sanitize(value: any): Partial<Product> {
    return {
      id: typeof value.id === 'number' && value.id > 0 ? value.id : undefined,
      name: typeof value.name === 'string' ? value.name.trim() : undefined,
      price: typeof value.price === 'number' && value.price >= 0 ? value.price : undefined,
      subcategoryId: typeof value.subcategoryId === 'number' ? value.subcategoryId : undefined,
      order: typeof value.order === 'number' ? value.order : undefined,
      description: typeof value.description === 'string' ? value.description : undefined,
      image: typeof value.image === 'string' ? value.image : undefined,
    };
  }
}

/**
 * ✅ CartItemValidator - Clase estática con métodos helper
 * (Consolidada para evitar duplicación de código)
 */
export class CartItemValidator {
  static validate(value: any): value is CartItem {
    return validateCartItem(value);
  }

  static validateOrThrow(value: any, context = 'CartItem'): CartItem {
    if (!this.validate(value)) {
      throw new Error(`${context} validation failed: ${JSON.stringify(value)}`);
    }
    return value;
  }
}

/**
 * ✅ Type guards para uso en condicionales y assertions
 */
export function isValidProduct(value: unknown): value is Product {
  return ProductValidator.validate(value);
}

export function isValidCartItem(value: unknown): value is CartItem {
  return CartItemValidator.validate(value);
}

/**
 * Validador de Category
 */
export function validateCategory(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'number' &&
    data.id > 0 &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    typeof data.order === 'number' &&
    data.order >= 0 &&
    (typeof data.description === 'string' || data.description === undefined)
  );
}

/**
 * Validador de Subcategory
 */
export function validateSubcategory(data: any): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'number' &&
    data.id > 0 &&
    typeof data.categoryId === 'number' &&
    data.categoryId > 0 &&
    typeof data.name === 'string' &&
    data.name.trim().length > 0 &&
    typeof data.order === 'number' &&
    data.order >= 0
  );
}

/**
 * Validador de respuesta API
 */
export function validateApiResponse<T>(
  data: any,
  validator: (item: any) => boolean
): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.success === 'boolean' &&
    typeof data.statusCode === 'number' &&
    (data.success ? (Array.isArray(data.data) && data.data.every(validator)) : true)
  );
}

/**
 * Thrown error guard - lanza excepción si validación falla
 */
export function assertProduct(data: any): asserts data is { id: number; name: string; price: number; subcategoryId: number; order: number } {
  if (!validateProduct(data)) {
    throw new Error(`Invalid Product: ${JSON.stringify(data)}`);
  }
}

export function assertCartItem(data: any): asserts data is { product: any; qty: number } {
  if (!validateCartItem(data)) {
    throw new Error(`Invalid CartItem: ${JSON.stringify(data)}`);
  }
}
