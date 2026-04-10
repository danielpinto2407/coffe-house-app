import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private readonly supabase = inject(SupabaseService);
  private readonly tableName = 'categories';

  private readonly _categories = signal<Category[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly categories = computed(() => this._categories());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async loadCategories(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const categories = await this.supabase.query<Category>(this.tableName, {
        order: [{ column: 'order', ascending: true }]
      });
      this._categories.set(categories || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar categorías';
      this._error.set(errorMsg);
    } finally {
      this._loading.set(false);
    }
  }

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    this._error.set(null);

    try {
      if (!category.name?.trim()) {
        throw new Error('Nombre de categoría es requerido');
      }

      const newCategory = await this.supabase.insert<Category>(this.tableName, category);
      
      if (newCategory) {
        this._categories.set([...this.categories(), newCategory as Category]);
      }

      return newCategory as Category;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear categoría';
      this._error.set(errorMsg);
      throw err;
    }
  }

  async updateCategory(id: number, updates: Partial<Category>): Promise<Category> {
    this._error.set(null);

    try {
      const updated = await this.supabase.update<Category>(this.tableName, id, updates);

      if (updated) {
        const index = this.categories().findIndex(c => c.id === id);
        if (index >= 0) {
          const updated_categories = [...this.categories()];
          updated_categories[index] = { ...updated_categories[index], ...updates };
          this._categories.set(updated_categories);
        }
      }

      return updated as Category;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar categoría';
      this._error.set(errorMsg);
      throw err;
    }
  }

  async deleteCategory(id: number): Promise<void> {
    this._error.set(null);

    try {
      await this.supabase.delete(this.tableName, id);
      this._categories.set(this.categories().filter(c => c.id !== id));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar categoría';
      this._error.set(errorMsg);
      throw err;
    }
  }

  clearError(): void {
    this._error.set(null);
  }
}
