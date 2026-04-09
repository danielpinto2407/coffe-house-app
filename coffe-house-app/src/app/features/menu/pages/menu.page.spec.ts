import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MenuPage } from './menu.page';
import { MenuApiService } from '../services/menu-api.service';
import { of } from 'rxjs';
import { MenuStructure } from '../models/menu-structure.model';

describe('MenuPage', () => {
  let component: MenuPage;
  let fixture: ComponentFixture<MenuPage>;
  let menuApiService: MenuApiService;

  const mockMenuStructure: MenuStructure[] = [
    {
      id: 1,
      name: 'Bebidas',
      order: 1,
      description: 'Refrescos, cafés y tés',
      subcategories: [
        {
          id: 10,
          categoryId: 1,
          name: 'Calientes',
          order: 1,
          description: 'Cafés calientes',
          products: [
            {
              id: 100,
              subcategoryId: 10,
              name: 'Espresso',
              price: 5500,
              order: 1,
              description: 'Café intenso'
            }
          ]
        }
      ]
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuPage],
      providers: [MenuApiService]
    }).compileComponents();

    menuApiService = TestBed.inject(MenuApiService);
    
    // Mock del servicio
    spyOn(menuApiService, 'getFullMenu').and.returnValue(of(mockMenuStructure));

    fixture = TestBed.createComponent(MenuPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Signals Initialization', () => {
    it('should initialize fullMenu signal as empty array', () => {
      expect(component.fullMenu()).toEqual([]);
    });

    it('should initialize searchTerm signal as empty string', () => {
      expect(component.searchTerm()).toBe('');
    });

    it('should initialize isLoading signal as true', () => {
      expect(component.isLoading()).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should load menu from service on init', (done) => {
      component.ngOnInit();

      // El servicio debe ser llamado
      expect(menuApiService.getFullMenu).toHaveBeenCalled();

      // Esperar a que se actualicen los signals (microtask)
      setTimeout(() => {
        expect(component.fullMenu()).toEqual(mockMenuStructure);
        expect(component.isLoading()).toBe(false);
        done();
      }, 0);
    });
  });

  describe('Computed menu signal', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component.ngOnInit();
    });

    it('should return full menu when searchTerm is empty', (done) => {
      setTimeout(() => {
        component.searchTerm.set('');
        expect(component.menu()).toEqual(mockMenuStructure);
        done();
      }, 0);
    });

    it('should filter menu based on searchTerm', (done) => {
      setTimeout(() => {
        component.searchTerm.set('Espresso');
        const filtered = component.menu();
        
        // Debe encontrar al menos un producto (Espresso)
        let foundEspresso = false;
        filtered.forEach(cat => {
          cat.subcategories.forEach(sub => {
            sub.products.forEach(prod => {
              if (prod.name.includes('Espresso')) {
                foundEspresso = true;
              }
            });
          });
        });
        
        expect(foundEspresso).toBe(true);
        done();
      }, 0);
    });

    it('should return empty array when no products match', (done) => {
      setTimeout(() => {
        component.searchTerm.set('XYZABC123');
        expect(component.menu().length).toBe(0);
        done();
      }, 0);
    });
  });

  describe('onSearch', () => {
    it('should trigger search with debounce', fakeAsync(() => {
      component.ngOnInit();
      
      // Simular múltiples inputs
      component.onSearch('Esp');
      tick(100);
      component.onSearch('Espr');
      tick(100);
      component.onSearch('Espresso');
      tick(100);
      
      // Esperar el debounce
      tick(300);
      
      // Solo la última búsqueda debe ser procesada
      expect(component.searchTerm()).toBe('Espresso');
    }));

    it('should not filter on each keystroke due to debounce', fakeAsync(() => {
      component.ngOnInit();
      
      const initialSearchTerm = component.searchTerm();
      
      component.onSearch('a');
      tick(100); // No ha pasado el debounce
      
      expect(component.searchTerm()).toBe(initialSearchTerm);
      
      tick(300); // Ahora pasa el debounce
      expect(component.searchTerm()).toBe('a');
    }));
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      component.fullMenu.set(mockMenuStructure);
      component.isLoading.set(false);
      fixture.detectChanges();
    });

    it('should display loading message when isLoading is true', () => {
      component.isLoading.set(true);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Cargando menú');
    });

    it('should display no results message when menu is empty', () => {
      component.fullMenu.set([]);
      component.isLoading.set(false);
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('No se encontraron productos');
    });

    it('should display menu structure when data is loaded', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled.textContent).toContain('Bebidas');
      expect(compiled.textContent).toContain('Calientes');
      expect(compiled.textContent).toContain('Espresso');
    });

    it('should render SearchBarComponent', () => {
      fixture.detectChanges();
      
      const searchBar = fixture.debugElement.queryAll((el) =>
        el.name === 'app-search-bar'
      );
      expect(searchBar.length).toBeGreaterThan(0);
    });

    it('should render ProductCardComponent for each product', () => {
      fixture.detectChanges();
      
      const productCards = fixture.debugElement.queryAll((el) =>
        el.name === 'app-product-card'
      );
      expect(productCards.length).toBe(1); // Tenemos 1 producto en el mock
    });
  });
});
