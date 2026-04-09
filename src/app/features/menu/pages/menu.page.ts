import { Component, OnInit, signal, computed, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { MenuApiService } from '../services/menu-api.service';
import { MenuStructure } from '../models/menu-structure.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SearchBarComponent, FormsModule],
  templateUrl: './menu.page.html',
})
export class MenuPage implements OnInit {
  private readonly menuApi = inject(MenuApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ✅ SIGNALS: Estado reactivo moderno
  fullMenu = signal<MenuStructure[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);

  // ✅ COMPUTED: Menú filtrado calculado reactivamente
  menu = computed(() => {
    const term = this.searchTerm();
    if (!term.trim()) {
      return this.fullMenu();
    }
    return this.filterMenu(this.fullMenu(), term);
  });

  // ✅ Debounce para búsqueda (evita filtros excesivos)
  private readonly searchSubject = new Subject<string>();

  constructor() {
    // ✅ Desuscripción automática cuando el componente se destruye
    this.searchSubject
      .pipe(
        debounceTime(300), // Espera 300ms después de que el usuario deje de escribir
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((term: string) => {
        this.searchTerm.set(term);
      });
  }

  ngOnInit(): void {
    this.isLoading.set(true);
    this.menuApi.getFullMenu()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((menu: MenuStructure[]) => {
        this.fullMenu.set(menu);
        this.isLoading.set(false);
      });
  }

  /**
   * ✅ Listener para eventos de búsqueda del SearchBar
   * Usa Subject + debounce para no filtrar a cada keystroke
   */
  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * ✅ Filtrado profundo: mantiene estructura jerárquica
   * Solo retorna categorías y subcategorías que tienen productos que coinciden
   */
  private filterMenu(menu: MenuStructure[], searchTerm: string): MenuStructure[] {
    const term = searchTerm.toLowerCase().trim();

    return menu
      .map(category => ({
        ...category,
        subcategories: category.subcategories
          .map(subcategory => ({
            ...subcategory,
            products: subcategory.products.filter(product =>
              this.productMatches(product, term)
            )
          }))
          .filter(subcategory => subcategory.products.length > 0)
      }))
      .filter(category => category.subcategories.length > 0);
  }

  /**
   * Helper: valida si un producto coincide con el término de búsqueda
   */
  private productMatches(product: any, term: string): boolean {
    const name = product.name?.toLowerCase() || '';
    const desc = product.description?.toLowerCase() || '';
    return name.includes(term) || desc.includes(term);
  }
}
