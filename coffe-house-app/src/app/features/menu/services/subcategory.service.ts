import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Subcategory } from '../models/subcategory.model';

@Injectable({
  providedIn: 'root'
})
export class SubcategoryService {
  private readonly supabase = inject(SupabaseService);
  private readonly tableName = 'subcategories';

  private readonly _subcategories = signal<Subcategory[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly subcategories = computed(() => this._subcategories());
  readonly loading = computed(() => this._loading());
  readonly error = computed(() => this._error());

  async loadSubcategories(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);

    try {
      const subcategories = await this.supabase.query<Subcategory>(this.tableName, {
        order: [{ column: 'order', ascending: true }]
      });
      this._subcategories.set(subcategories || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al cargar subcategorías';
      this._error.set(errorMsg);
      console.error('[SubcategoryService] Error loading subcategories:', errorMsg);
    } finally {
      this._loading.set(false);
    }
  }

  getSubcategoriesByCategory(categoryId: number): Subcategory[] {
    return this.subcategories().filter(s => s.categoryId === categoryId);
  }

  async createSubcategory(subcategory: Omit<Subcategory, 'id'>): Promise<Subcategory> {
    this._error.set(null);

    try {
      if (!subcategory.name?.trim()) {
        throw new Error('Nombre de subcategoría es requerido');
      }

      const newSubcategory = await this.supabase.insert<Subcategory>(this.tableName, subcategory);
      
      if (newSubcategory) {
        this._subcategories.set([...this.subcategories(), newSubcategory as Subcategory]);
      }

      return newSubcategory as Subcategory;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al crear subcategoría';
      this._error.set(errorMsg);
      throw err;
    }
  }

  async updateSubcategory(id: number, updates: Partial<Subcategory>): Promise<Subcategory> {
    this._error.set(null);

    try {
      const updated = await this.supabase.update<Subcategory>(this.tableName, id, updates);

      if (updated) {
        const index = this.subcategories().findIndex(s => s.id === id);
        if (index >= 0) {
          const updated_subcategories = [...this.subcategories()];
          updated_subcategories[index] = { ...updated_subcategories[index], ...updates };
          this._subcategories.set(updated_subcategories);
        }
      }

      return updated as Subcategory;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al actualizar subcategoría';
      this._error.set(errorMsg);
      throw err;
    }
  }

  async deleteSubcategory(id: number): Promise<void> {
    this._error.set(null);

    try {
      await this.supabase.delete(this.tableName, id);
      this._subcategories.set(this.subcategories().filter(s => s.id !== id));
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error al eliminar subcategoría';
      this._error.set(errorMsg);
      throw err;
    }
  }

  clearError(): void {
    this._error.set(null);
  }
}
