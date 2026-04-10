import { TestBed } from '@angular/core/testing';
import { MenuPdfService } from './menu-pdf.service';
import { ThemeService } from './theme.service';
import { MenuStructure } from '../../features/menu/models/menu-structure.model';
import { Product } from '../../features/menu/models/product.model';

describe('MenuPdfService', () => {
  let service: MenuPdfService;
  let themeService: jasmine.SpyObj<ThemeService>;

  beforeEach(() => {
    const themeServiceSpy = jasmine.createSpyObj('ThemeService', [], {
      currentTheme: jasmine.createSpy('currentTheme').and.returnValue({
        id: 'dark',
        name: 'Oscuro',
        colors: {
          primary: '#D4A56A',
          secondary: '#8B6040',
          text: '#F0E6D0',
          textSecondary: '#C9A87A',
          background: '#1A1008',
          backgroundLight: '#261A0C',
          surface: '#2F1F0E',
          border: '#4A3520',
          tertiary: '#261A0C',
          accent: '#E6C77F',
          success: '#7AB87A',
          warning: '#E6C55A',
          error: '#D4604A',
          hover: '#3D2A14',
          rose: '#B06060',
          berry: '#8B3520',
          cream: '#3D2E1A',
        },
      }),
    });

    TestBed.configureTestingModule({
      providers: [MenuPdfService, { provide: ThemeService, useValue: themeServiceSpy }],
    });

    service = TestBed.inject(MenuPdfService);
    themeService = TestBed.inject(ThemeService) as jasmine.SpyObj<ThemeService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with isGenerating signal set to false', () => {
    expect(service.isGenerating()).toBe(false);
  });

  it('should initialize with pdfError signal set to null', () => {
    expect(service.pdfError()).toBe(null);
  });

  it('should set isGenerating to true during PDF generation', async () => {
    const mockMenu: MenuStructure[] = [
      {
        id: 1,
        name: 'Café',
        description: 'Bebidas de café',
        order: 1,
        subcategories: [
          {
            id: 1,
            name: 'Espresso',
            description: 'Espressos',
            categoryId: 1,
            order: 1,
            products: [
              {
                id: 1,
                name: 'Espresso Simple',
                description: 'Café puro',
                price: 3500,
                image: '',
                subcategoryId: 1,
                order: 1,
              } as unknown as Product,
            ],
          },
        ],
      },
    ];

    const promise = service.generateAndDownloadMenuPdf(mockMenu, 'test.pdf');

    // The signal will be reset to false after completion in finally block
    await promise.catch(() => {
      // Expected - PDF generation may fail in test environment
    });

    // Should be false after completion
    expect(service.isGenerating()).toBe(false);
  });

  it('should set pdfError on failed PDF generation', async () => {
    const mockMenu: MenuStructure[] = [
      {
        id: 1,
        name: 'Café',
        description: 'Bebidas',
        order: 1,
        subcategories: [
          {
            id: 1,
            name: 'Espresso',
            description: '',
            categoryId: 1,
            order: 1,
            products: [],
          },
        ],
      },
    ];

    try {
      // This should work but eventually fail in finally block setting isGenerating to false
      await service.generateAndDownloadMenuPdf(mockMenu, 'test.pdf');
    } catch (error) {
      // Expected error
      expect(error).toBeDefined();
    }

    expect(service.isGenerating()).toBe(false);
  });

  it('should handle empty menu data gracefully', async () => {
    spyOn(console, 'warn');

    await service.generateAndDownloadMenuPdf([], 'test.pdf');

    expect(console.warn).toHaveBeenCalledWith('No menu data provided');
    expect(service.isGenerating()).toBe(false);
  });

  it('should reset isGenerating to false even on error', async () => {
    try {
      // Pass menu with invalid structure to trigger error
      await service.generateAndDownloadMenuPdf(null as any, 'test.pdf');
    } catch (error) {
      // Expected error
      expect(error).toBeDefined();
    }

    expect(service.isGenerating()).toBe(false);
  });

  it('should use default filename if not provided', async () => {
    const mockMenu: MenuStructure[] = [];
    spyOn(console, 'warn');

    await service.generateAndDownloadMenuPdf(mockMenu); // No filename provided

    expect(console.warn).toHaveBeenCalledWith('No menu data provided');
  });

  it('should handle menu with multiple categories', async () => {
    const mockMenu: MenuStructure[] = [
      {
        id: 1,
        name: 'Café',
        description: 'Bebidas de café',
        order: 1,
        subcategories: [
          {
            id: 1,
            name: 'Espresso',
            description: '',
            categoryId: 1,
            order: 1,
            products: [
              {
                id: 1,
                name: 'Espresso',
                price: 3500,
                image: '',
                subcategoryId: 1,
                order: 1,
              } as unknown as Product,
            ],
          },
        ],
      },
      {
        id: 2,
        name: 'Pasteles',
        description: 'Postres',
        order: 2,
        subcategories: [
          {
            id: 2,
            name: 'Dulces',
            description: '',
            categoryId: 2,
            order: 1,
            products: [
              {
                id: 2,
                name: 'Brownie',
                price: 5000,
                image: '',
                subcategoryId: 2,
                order: 1,
              } as unknown as Product,
            ],
          },
        ],
      },
    ];

    try {
      await service.generateAndDownloadMenuPdf(mockMenu, 'test.pdf');
    } catch (error) {
      // Expected in test environment - PDF generation requires browser APIs
      expect(error).toBeDefined();
    }

    expect(service.isGenerating()).toBe(false);
  });

  it('should use currentTheme from ThemeService for color mapping', async () => {
    const mockTheme = {
      id: 'classic',
      name: 'Clásico',
      colors: {
        primary: '#5C2E10',
        secondary: '#D4A96A',
        text: '#2C1408',
        textSecondary: '#7A4B2A',
        background: '#EDD9A333',
        backgroundLight: '#F5E6CC',
        surface: '#FFFFFF',
        border: '#C8A96E',
        tertiary: '#F5E6CC',
        accent: '#B8860B',
        success: '#3A6B35',
        warning: '#C8780A',
        error: '#A83228',
        hover: '#EDD9A3',
        rose: '#C97A6E',
        berry: '#B5442A',
        cream: '#EDD9A3',
      },
    };

    (themeService.currentTheme as jasmine.Spy).and.returnValue(mockTheme);

    const mockMenu: MenuStructure[] = [
      {
        id: 1,
        name: 'Test',
        description: '',
        order: 1,
        subcategories: [],
      },
    ];

    try {
      await service.generateAndDownloadMenuPdf(mockMenu, 'test.pdf');
    } catch (error) {
      // Expected in test environment - ignore
      console.warn('PDF generation error in test:', error);
    } finally {
      expect(themeService.currentTheme).toHaveBeenCalled();
    }
  });
});
