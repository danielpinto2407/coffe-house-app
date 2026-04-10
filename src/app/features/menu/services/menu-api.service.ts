import { Injectable } from '@angular/core';
import { CATEGORIES, SUBCATEGORIES, PRODUCTS } from '../data/menu.mock';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { MenuStructure, SearchableProduct } from '../models/menu-structure.model';

@Injectable({
  providedIn: 'root'
})
export class MenuApiService {
  // ✅ Cache del menú completo: una vez cargado, no se reconstruye
  private fullMenu$: Observable<MenuStructure[]> | null = null;

  // ✅ Índice plano de todos los productos para búsqueda rápida
  private searchIndex: SearchableProduct[] = [];

  /**
   * ✅ Obtiene el menú completo estructurado con caché
   * Evita reconstruir el árbol innecesariamente
   */
  getFullMenu(): Observable<MenuStructure[]> {
    this.fullMenu$ ??= of(CATEGORIES).pipe(
      map(categories => {
        // Construir índice de búsqueda una sola vez
        if (this.searchIndex.length === 0) {
          this.buildSearchIndex(categories);
        }
        return this.buildMenuStructure(categories);
      }),
      shareReplay(1) // ✅ Cache: recalcula solo en la primera suscripción
    );
    return this.fullMenu$;
  }

  /**
   * ✅ Búsqueda eficiente en el índice
   * Retorna categorías y subcategorías que contienen resultados
   * Centraliza toda la lógica de filtrado
   */
  searchMenu(searchTerm: string): Observable<MenuStructure[]> {
    return this.getFullMenu().pipe(
      map(menu => {
        if (!searchTerm?.trim()) {
          return menu; // Retorna menú completo si searchTerm está vacío
        }

        const term = searchTerm.toLowerCase().trim();

        // Filtrar en el índice (O(n) una sola vez)
        const matchedProductIds = new Set(
          this.searchIndex
            .filter(p => 
              p.name.toLowerCase().includes(term) || 
              p.description?.toLowerCase().includes(term)
            )
            .map(p => p.id)
        );

        // Reconstruir árbol solo con productos encontrados
        return this.filterMenuByProductIds(menu, matchedProductIds);
      })
    );
  }

  // ============================================
  // PRIVATE: Métodos auxiliares
  // ============================================

  /**
   * Construye la estructura jerárquica del menú
   */
  private buildMenuStructure(categories: typeof CATEGORIES): MenuStructure[] {
    return categories
      .map((category: typeof CATEGORIES[0]) => ({
        ...category,
        subcategories: SUBCATEGORIES
          .filter((s: typeof SUBCATEGORIES[0]) => s.categoryId === category.id)
          .map((sub: typeof SUBCATEGORIES[0]) => ({
            ...sub,
            products: PRODUCTS
              .filter((p: typeof PRODUCTS[0]) => p.subcategoryId === sub.id)
          }))
      }))
      .sort((a, b) => a.order - b.order);
  }

  /**
   * Crea un índice plano para búsquedas rápidas
   */
  private buildSearchIndex(categories: typeof CATEGORIES): void {
    this.searchIndex = PRODUCTS.map(product => {
      const sub = SUBCATEGORIES.find(s => s.id === product.subcategoryId);
      const cat = CATEGORIES.find(c => c.id === sub?.categoryId);
      return {
        ...product,
        categoryName: cat?.name || '',
        subcategoryName: sub?.name || ''
      };
    });
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

