import { Injectable, inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';
import { map, shareReplay, switchMap, catchError } from 'rxjs/operators';
import { MenuStructure, SearchableProduct } from '../models/menu-structure.model';
import { CategoryService } from './category.service';
import { SubcategoryService } from './subcategory.service';
import { ProductService } from './product.service';

@Injectable({
  providedIn: 'root'
})
export class MenuApiService {
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly productService = inject(ProductService);

  // ✅ Cache del menú completo: una vez cargado, no se reconstruye
  private fullMenu$: Observable<MenuStructure[]> | null = null;

  // ✅ Índice plano de todos los productos para búsqueda rápida
  private searchIndex: SearchableProduct[] = [];

  /**
   * ✅ Obtiene el menú completo desde Supabase
   * Evita reconstruir el árbol innecesariamente con caché
   */
  getFullMenu(): Observable<MenuStructure[]> {
    this.fullMenu$ ??= from(this.loadMenuFromSupabase()).pipe(
      map(categories => {
        // Construir índice de búsqueda una sola vez
        if (this.searchIndex.length === 0) {
          this.buildSearchIndex(categories);
        }
        return categories;
      }),
      shareReplay(1) // ✅ Cache: recalcula solo en la primera suscripción
    );
    return this.fullMenu$;
  }

  /**
   * ✅ Carga todos los datos de Supabase y construye la estructura del menú
   * Soporta productos directos en categorías y productos en subcategorías
   */
  private async loadMenuFromSupabase(): Promise<MenuStructure[]> {
    try {
      // Cargar datos de Supabase
      await this.categoryService.loadCategories();
      await this.subcategoryService.loadSubcategories();
      await this.productService.loadProducts();

      // Construir la estructura del menú desde datos reales
      const categories = this.categoryService.categories();
      
      return categories
        .map(category => {
          // ✅ Productos directos de la categoría (sin subcategoría)
          const directProducts = this.productService
            .products()
            .filter(p => p.categoryId === category.id && !p.subcategoryId && p.active !== false)
            .sort((a, b) => a.order - b.order);

          // ✅ Subcategorías con sus productos
          const subcategories = this.subcategoryService
            .subcategories()
            .filter(s => s.categoryId === category.id)
            .map(sub => ({
              ...sub,
              products: this.productService
                .products()
                .filter(p => p.subcategoryId === sub.id && p.active !== false)
                .sort((a, b) => a.order - b.order)
            }))
            .filter(sub => sub.products.length > 0) // ✅ Solo subcategorías con productos
            .sort((a, b) => a.order - b.order);

          return {
            ...category,
            products: directProducts.length > 0 ? directProducts : undefined,
            subcategories: subcategories
          };
        })
        // ✅ Solo categorías que tengan productos directos O subcategorías con productos
        .filter(cat => (cat.products && cat.products.length > 0) || cat.subcategories.length > 0)
        .sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error cargando menú desde Supabase:', error);
      return [];
    }
  }

  /**
   * ✅ Búsqueda eficiente en el índice desde Supabase
   * Retorna categorías y subcategorías que contienen resultados
   */
  searchMenu(searchTerm: string): Observable<MenuStructure[]> {
    return this.getFullMenu().pipe(
      map(menu => {
        if (!searchTerm?.trim()) {
          return menu; // Retorna menú completo si searchTerm está vacío
        }

        // Normalizar término: convertir a minúsculas y remover tildes/acentos
        const normalizedTerm = this.normalizeText(searchTerm).toLowerCase().trim();

        // Filtrar en el índice (O(n) una sola vez)
        const matchedProductIds = new Set(
          this.searchIndex
            .filter(p => {
              const normalizedName = this.normalizeText(p.name).toLowerCase();
              const normalizedDesc = p.description ? this.normalizeText(p.description).toLowerCase() : '';
              
              return (
                normalizedName.includes(normalizedTerm) || 
                normalizedDesc.includes(normalizedTerm)
              );
            })
            .map(p => p.id)
        );

        // Reconstruir árbol solo con productos encontrados
        return this.filterMenuByProductIds(menu, matchedProductIds);
      })
    );
  }

  /**
   * ✅ Normaliza texto: convierte tildes/acentos a caracteres sin diacríticos
   * "búsqueda" → "busqueda"
   */
  private normalizeText(text: string): string {
    return text
      .normalize('NFD')                           // Descompone caracteres con acentos
      .replace(/[\u0300-\u036f]/g, '');          // Remueve diacríticos
  }

  // ============================================
  // PRIVATE: Métodos auxiliares
  // ============================================

  /**
   * Crea un índice plano para búsquedas rápidas
   * Incluye productos directos de categorías y productos en subcategorías
   */
  private buildSearchIndex(menu: MenuStructure[]): void {
    this.searchIndex = [];
    
    for (const category of menu) {
      // ✅ Productos directos de la categoría
      if (category.products) {
        for (const product of category.products) {
          this.searchIndex.push({
            ...product,
            categoryName: category.name,
            subcategoryName: '' // Sin subcategoría
          });
        }
      }

      // ✅ Productos en subcategorías
      for (const subcategory of category.subcategories) {
        for (const product of subcategory.products) {
          this.searchIndex.push({
            ...product,
            categoryName: category.name,
            subcategoryName: subcategory.name
          });
        }
      }
    }
  }

  /**
   * Filtra el menú manteniendo la estructura, solo con productos de IDs específicos
   */
  private filterMenuByProductIds(
    menu: MenuStructure[],
    productIds: Set<number>
  ): MenuStructure[] {
    return menu
      .map(category => ({
        ...category,
        subcategories: category.subcategories
          .map(sub => ({
            ...sub,
            products: sub.products.filter(p => productIds.has(p.id))
          }))
          .filter(sub => sub.products.length > 0)
      }))
      .filter(cat => cat.subcategories.length > 0);
  }
}

