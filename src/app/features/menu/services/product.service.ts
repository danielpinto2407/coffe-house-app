import { Injectable, inject, signal, computed } from '@angular/core';
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

  // Computed signals (exponer solo lectura)
  readonly products = computed(() => this._products());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

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
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar productos';
      this._error.set(errorMsg);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Obtener productos por subcategoría
   */
  getProductsBySubcategory(subcategoryId: number): Product[] {
    return this.products().filter(p => p.subcategoryId === subcategoryId);
  }

  /**
   * Crear un nuevo producto
   */
  async createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    this._error.set(null);

    try {
      // Validar que el producto tenga campos requeridos
      if (!product.name?.trim() || product.price < 0) {
        throw new Error('Nombre y precio son requeridos');
      }

      const newProduct = await this.supabase.insert<Product>(this.tableName, product);
      
      if (newProduct) {
        // Agregar a la lista local
        this._products.set([...this.products(), newProduct as Product]);
      }

      return newProduct as Product;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear producto';
      this._error.set(errorMsg);
      throw err;
    }
  }

  /**
   * Actualizar un producto existente
   */
  async updateProduct(id: number, updates: Partial<Product>): Promise<Product> {
    this._error.set(null);

    try {
      // Validar actualizaciones
      if (updates.price !== undefined && updates.price < 0) {
        throw new Error('El precio no puede ser negativo');
      }

      const updated = await this.supabase.update<Product>(this.tableName, id, updates);

      if (updated) {
        // Actualizar en lista local
        const index = this.products().findIndex(p => p.id === id);
        if (index >= 0) {
          const updated_products = [...this.products()];
          updated_products[index] = { ...updated_products[index], ...updates };
          this._products.set(updated_products);
        }
      }

      return updated as Product;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar producto';
      this._error.set(errorMsg);
      throw err;
    }
  }

  /**
   * Eliminar un producto
   */
  async deleteProduct(id: number): Promise<void> {
    this._error.set(null);

    try {
      await this.supabase.delete(this.tableName, id);
      
      // Remover de lista local
      this._products.set(this.products().filter(p => p.id !== id));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar producto';
      this._error.set(errorMsg);
      throw err;
    }
  }

  /**
   * Limpiar errores
   */
  clearError(): void {
    this._error.set(null);
  }
}
