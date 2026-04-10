import { TestBed } from '@angular/core/testing';
import { MenuApiService } from './menu-api.service';
import { MenuStructure } from '../models/menu-structure.model';

describe('MenuApiService', () => {
  let service: MenuApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MenuApiService]
    });
    service = TestBed.inject(MenuApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getFullMenu', () => {
    it('should return fully structured menu with categories, subcategories and products', (done) => {
      service.getFullMenu().subscribe((menu: MenuStructure[]) => {
        expect(menu.length).toBeGreaterThan(0);
        expect(menu[0].subcategories).toBeDefined();
        expect(menu[0].subcategories[0].products).toBeDefined();
        done();
      });
    });

    it('should order categories, subcategories and products by their order property', (done) => {
      service.getFullMenu().subscribe((menu: MenuStructure[]) => {
        // Verificar que categorías están ordenadas
        for (let i = 0; i < menu.length - 1; i++) {
          expect(menu[i].order).toBeLessThanOrEqual(menu[i + 1].order);
        }

        // Verificar que subcategorías y productos están ordenados
        menu.forEach(category => {
          for (let i = 0; i < category.subcategories.length - 1; i++) {
            expect(category.subcategories[i].order)
              .toBeLessThanOrEqual(category.subcategories[i + 1].order);
          }

          category.subcategories.forEach(sub => {
            for (let i = 0; i < sub.products.length - 1; i++) {
              expect(sub.products[i].order)
                .toBeLessThanOrEqual(sub.products[i + 1].order);
            }
          });
        });
        done();
      });
    });

    it('should use cache on subsequent calls (shareReplay)', (done) => {
      const firstCall = service.getFullMenu();
      const secondCall = service.getFullMenu();

      // Las dos observables deben ser la misma instancia debido a shareReplay
      expect(firstCall).toBe(secondCall);
      done();
    });
  });

  describe('searchMenu', () => {
    it('should return full menu when searchTerm is empty', (done) => {
      service.getFullMenu().subscribe((expectedMenu: MenuStructure[]) => {
        service.searchMenu('').subscribe((menu: MenuStructure[]) => {
          expect(menu).toEqual(expectedMenu);
          done();
        });
      });
    });

    it('should filter products by name', (done) => {
      service.searchMenu('Espresso').subscribe((menu: MenuStructure[]) => {
        let foundEspresso = false;
        
        menu.forEach(cat => {
          cat.subcategories.forEach(sub => {
            sub.products.forEach(prod => {
              if (prod.name.toLowerCase().includes('espresso')) {
                foundEspresso = true;
              }
            });
          });
        });
        
        expect(foundEspresso).toBe(true);
        done();
      });
    });

    it('should filter products by description', (done) => {
      service.searchMenu('cremoso').subscribe((menu: MenuStructure[]) => {
        // Debe encontrar algún producto con "cremoso" en la descripción
        let found = false;
        
        menu.forEach(cat => {
          cat.subcategories.forEach(sub => {
            sub.products.forEach(prod => {
              if (prod.description?.toLowerCase().includes('cremoso')) {
                found = true;
              }
            });
          });
        });
        
        expect(found).toBe(true);
        done();
      });
    });

    it('should maintain hierarchical structure in search results', (done) => {
      service.searchMenu('Capuccino').subscribe((menu: MenuStructure[]) => {
        // Todas las categorías deben tener al menos una subcategoría
        menu.forEach(cat => {
          expect(cat.subcategories.length).toBeGreaterThan(0);
          
          // Todas las subcategorías deben tener al menos un producto
          cat.subcategories.forEach(sub => {
            expect(sub.products.length).toBeGreaterThan(0);
          });
        });
        done();
      });
    });

    it('should return empty array when no products match search', (done) => {
      service.searchMenu('XYZABC123').subscribe((menu: MenuStructure[]) => {
        expect(menu.length).toBe(0);
        done();
      });
    });

    it('should be case-insensitive', (done) => {
      service.searchMenu('ESPRESSO').subscribe((menu1: MenuStructure[]) => {
        service.searchMenu('espresso').subscribe((menu2: MenuStructure[]) => {
          // Ambos deben retornar el mismo número de resultados
          const count1 = menu1.reduce((acc, cat) => 
            acc + cat.subcategories.reduce((subAcc, sub) => subAcc + sub.products.length, 0), 0);
          
          const count2 = menu2.reduce((acc, cat) => 
            acc + cat.subcategories.reduce((subAcc, sub) => subAcc + sub.products.length, 0), 0);
          
          expect(count1).toBe(count2);
          done();
        });
      });
    });
  });
});
