import { Injectable, inject, signal, computed } from '@angular/core';
import { Subject } from 'rxjs';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly supabase = inject(SupabaseService);
  private readonly tableName = 'products';

  // Signals para estado reactivo
  private readonly _products = signal<Product[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  // ✅ Subject que emite cuando hay cambios de productos
  private readonly productsChangedSubject = new Subject<{ action: 'create' | 'update' | 'delete', product?: Product }>();
  readonly productsChanged$ = this.productsChangedSubject.asObservable();

  // Computed signals (exponer solo lectura)
  readonly products = computed(() => this._products());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  // ✅ (#3) Map computado para búsqueda O(1) por subcategoría
  private readonly _productsBySubcategory = computed(() => {
    const map = new Map<number, Product[]>();
    for (const p of this._products()) {
      const subId = p.subcategoryId;
      if (subId === undefined || subId === null) continue;
      const list = map.get(subId) ?? [];
      list.push(p);
      map.set(subId, list);
    }
    return map;
  });

  /**
   * Cargar todos los productos desde Supabase
   */
  async loadProducts(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const products = await this.supabase.query<Product>(this.tableName, {
        order: [{ column: 'order', ascending: true }]
      });
      this._products.set(products || []);
    } catch (err) {
      // ✅ (#5) Manejo de error centralizado
      this.handleError(err, 'Error al cargar productos');
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Obtener productos por subcategoría
   */
  // ✅ (#3) Usa el Map computado en lugar de filter en cada llamada
  getProductsBySubcategory(subcategoryId: number): Product[] {
    return this._productsBySubcategory().get(subcategoryId) ?? [];
  }

  /**
   * Crear un nuevo producto
   */
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    this._error.set(null);

    try {
      // ✅ (#6) Validación centralizada
      this.validateProduct(product);

      const newProduct = await this.supabase.insert<Product>(this.tableName, product);

      if (newProduct) {
        // Agregar a la lista local
        this._products.set([...this.products(), newProduct as Product]);
        // ✅ Emitir evento de cambio
        this.productsChangedSubject.next({ action: 'create', product: newProduct as Product });
      }

      return newProduct as Product;
    } catch (err) {
      // ✅ (#5) Manejo de error centralizado
      this.handleError(err, 'Error al crear producto');
    }
  }

  /**
   * Actualizar un producto existente
   */
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    this._error.set(null);

    try {
      // ✅ (#6) Validación centralizada
      this.validateProduct(updates);

      const updated = await this.supabase.update<Product>(this.tableName, id, updates);

      if (updated) {
        // ✅ (#1) Usa `updated` (dato real de BD) en lugar de `updates` (parcial enviado)
        const index = this.products().findIndex(p => p.id === id);
        if (index >= 0) {
          // ✅ (#4) Nombre de variable en camelCase
          const updatedProducts = [...this.products()];
          updatedProducts[index] = updated as Product;
          this._products.set(updatedProducts);
        }
        // ✅ Emitir evento de cambio
        this.productsChangedSubject.next({ action: 'update', product: updated as Product });
      }

      return updated as Product;
    } catch (err) {
      // ✅ (#5) Manejo de error centralizado
      this.handleError(err, 'Error al actualizar producto');
    }
  }

  /**
   * Eliminar un producto
   */
  async deleteProduct(id: number): Promise<void> {
    this._error.set(null);

    try {
      await this.supabase.delete(this.tableName, id);

      const deletedProduct = this.products().find(p => p.id === id);
      // Remover de lista local
      this._products.set(this.products().filter(p => p.id !== id));

      // ✅ (#2) Solo emite si el producto existía localmente
      if (deletedProduct) {
        this.productsChangedSubject.next({ action: 'delete', product: deletedProduct });
      }
    } catch (err) {
      // ✅ (#5) Manejo de error centralizado
      this.handleError(err, 'Error al eliminar producto');
    }
  }

  /**
   * Limpiar errores
   */
  clearError(): void {
    this._error.set(null);
  }

  // ✅ (#5) Helper centralizado para manejo de errores
  private handleError(err: unknown, defaultMsg: string): never {
    const errorMsg = err instanceof Error ? err.message : defaultMsg;
    this._error.set(errorMsg);
    throw err instanceof Error ? err : new Error(errorMsg);
  }

  // ✅ (#6) Validaciones centralizadas
  private validateProduct(product: Partial<Omit<Product, 'id'>>): void {
    if ('name' in product && !product.name?.trim()) {
      throw new Error('Nombre requerido');
    }
    if ('price' in product && product.price !== undefined && product.price < 0) {
      throw new Error('El precio no puede ser negativo');
    }
  }
}