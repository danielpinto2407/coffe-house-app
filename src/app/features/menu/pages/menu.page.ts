import { Component, OnInit, signal, computed, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject, switchMap, tap, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { MenuApiService } from '../services/menu-api.service';
import { MenuStructure } from '../models/menu-structure.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SearchBarComponent],
  templateUrl: './menu.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit {
  private readonly menuApi = inject(MenuApiService);
  private readonly destroyRef = inject(DestroyRef);

  // ✅ SIGNALS: Estado reactivo moderno
  protected readonly fullMenu = signal<MenuStructure[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly selectedCategoryId = signal<number | null>(null);

  // ✅ COMPUTED: Menú filtrado calculado reactivamente
  protected readonly menu = computed(() => this.fullMenu());

  // ✅ COMPUTED: Categorías disponibles (sin duplicados)
  protected readonly categories = computed(() => {
    return this.fullMenu().map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description
    }));
  });

  // ✅ COMPUTED: Subcategorías y productos de la categoría seleccionada
  protected readonly selectedCategoryData = computed(() => {
    const categoryId = this.selectedCategoryId();
    if (categoryId === null) return null;
    
    const category = this.fullMenu().find(cat => cat.id === categoryId);
    return category || null;
  });

  // ✅ Debounce para búsqueda (evita filtros excesivos)
  private readonly searchSubject = new Subject<string>();

  /**
   * ✅ Observable: Emisión del menú filtrado/completo reactivamente
   * Usa switchMap para cambiar entre búsquedas y cargar menú completo
   * SharedReplay para cachear último resultado
   */
  private readonly filteredMenu$ = this.searchSubject.pipe(
    debounceTime(300),
    tap(() => this.isLoading.set(true)),
    switchMap((term: string) => {
      if (!term?.trim()) {
        return this.menuApi.getFullMenu();
      }
      return this.menuApi.searchMenu(term);
    }),
    tap((menu: MenuStructure[]) => {
      this.fullMenu.set(menu);
      this.isLoading.set(false);
    }),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef)
  );

  constructor() {
    // ✅ Suscribirse al observable para inicializar el flujo reactivo
    this.filteredMenu$.subscribe();
  }

  ngOnInit(): void {
    // ✅ Emitir un término vacío para cargar el menú completo inicial
    // Esto evita una doble llamada API (vs hacerlo en ngOnInit)
    this.searchSubject.next('');

    // ✅ Al cargar el menú, seleccionar la primera categoría
    this.filteredMenu$
      .pipe(
        tap((menu: MenuStructure[]) => {
          if (menu.length > 0 && this.selectedCategoryId() === null) {
            this.selectedCategoryId.set(menu[0].id);
          }
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  /**
   * ✅ Cambiar categoría seleccionada
   */
  onSelectCategory(categoryId: number): void {
    this.selectedCategoryId.set(categoryId);
  }

  /**
   * ✅ Listener para eventos de búsqueda del SearchBar
   * Usa Subject + debounce para no filtrar a cada keystroke
   */
  onSearch(term: string): void {
    this.searchSubject.next(term);
  }
}

