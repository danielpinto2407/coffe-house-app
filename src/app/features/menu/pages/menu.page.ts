import { Component, OnInit, signal, computed, inject, DestroyRef, ChangeDetectionStrategy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { debounceTime, Subject, switchMap, tap, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { CategoryCardComponent } from '../components/category-card/category-card.component';
import { MenuApiService } from '../services/menu-api.service';
import { MenuStructure } from '../models/menu-structure.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SearchBarComponent, CategoryCardComponent],
  templateUrl: './menu.page.html',
  styleUrls: ['./menu.page.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit, AfterViewInit {
  private readonly menuApi = inject(MenuApiService);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild('categoryTabs') categoryTabs?: ElementRef<HTMLDivElement>;

  // ✅ SIGNALS: Estado reactivo moderno
  protected readonly fullMenu = signal<MenuStructure[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly selectedCategoryId = signal<number | null>(null);
  protected readonly searchTerm = signal<string>('');

  // ✅ COMPUTED: ¿Estamos en modo búsqueda?
  protected readonly isSearching = computed(() => this.searchTerm().trim().length > 0);

  // ✅ COMPUTED: Categorías disponibles (sin duplicados)
  protected readonly categories = computed(() => {
    return this.fullMenu().map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description
    }));
  });

  // ✅ COMPUTED: Subcategorías y productos de la categoría seleccionada (para DESKTOP)
  protected readonly selectedCategoryData = computed(() => {
    const categoryId = this.selectedCategoryId();
    if (categoryId === null) return null;
    
    const category = this.fullMenu().find(cat => cat.id === categoryId);
    return category || null;
  });

  // ✅ COMPUTED: Todos los productos de búsqueda (sin estructura)
  protected readonly allSearchProducts = computed(() => {
    const products: any[] = [];
    this.fullMenu().forEach(category => {
      if (category.products?.length) {
        products.push(...category.products);
      }
      category.subcategories.forEach(sub => {
        products.push(...sub.products);
      });
    });
    return products;
  });

  // ✅ Debounce para búsqueda (evita filtros excesivos)
  private readonly searchSubject = new Subject<string>();

  /**
   * ✅ Observable: Emisión del menú filtrado/completo reactivamente
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
      // Seleccionar primera categoría si no hay selección
      if (menu.length > 0 && this.selectedCategoryId() === null) {
        this.selectedCategoryId.set(menu[0].id);
      }
    }),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef)
  );

  constructor() {
    // ✅ Suscribirse al observable
    this.filteredMenu$.subscribe();
  }

  ngOnInit(): void {
    // ✅ Cargar menú completo inicial
    this.searchSubject.next('');
  }

  ngAfterViewInit(): void {
    // ✅ Scroll automático cuando cambia la categoría seleccionada
    setTimeout(() => this.scrollToActivePill(), 0);
  }

  onSelectCategory(categoryId: number): void {
    this.selectedCategoryId.set(categoryId);
    setTimeout(() => this.scrollToActivePill(), 0);
  }

  private scrollToActivePill(): void {
    if (!this.categoryTabs) return;

    const container = this.categoryTabs.nativeElement;
    const activeButton = container.querySelector('.category-pill.active') as HTMLElement;

    if (activeButton) {
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      const containerWidth = container.offsetWidth;
      const scrollPos = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      container.scrollTo({
        left: Math.max(0, scrollPos),
        behavior: 'smooth'
      });
    }
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.searchSubject.next(term);
  }
}

