import { TestBed } from '@angular/core/testing';
import { DOCUMENT } from '@angular/common';
import { CartService } from './cart-service';
import { Product } from '../../features/menu/models/product.model';

describe('CartService', () => {
  let service: CartService;
  let mockDocument: any;

  const mockProduct: Product = {
    id: 1,
    name: 'Espresso',
    price: 2.99,
    subcategoryId: 1,
    order: 1,
    description: 'Strong coffee',
    image: 'espresso.jpg',
  };

  const mockProduct2: Product = {
    id: 2,
    name: 'Latte',
    price: 4.99,
    subcategoryId: 1,
    order: 2,
    description: 'Creamy coffee',
    image: 'latte.jpg',
  };

  beforeEach(() => {
    mockDocument = {
      defaultView: { localStorage: {} },
    };

    TestBed.configureTestingModule({
      providers: [CartService, { provide: DOCUMENT, useValue: mockDocument }],
    });

    service = TestBed.inject(CartService);
  });

  describe('addProduct', () => {
    it('should add product to cart', (done) => {
      service.addProduct(mockProduct, 1);

      service.items$.subscribe((items) => {
        expect(items).toContain(jasmine.objectContaining({ product: mockProduct, qty: 1 }));
        done();
      });
    });

    it('should increment quantity if product already exists', (done) => {
      service.addProduct(mockProduct, 1);
      service.addProduct(mockProduct, 2);

      service.items$.subscribe((items) => {
        expect(items.length).toBe(1);
        expect(items[0].qty).toBe(3);
        done();
      });
    });

    it('should not add invalid product', (done) => {
      service.addProduct(null, 1);
      service.addProduct(undefined, 1);
      service.addProduct({ ...mockProduct, id: 0 }, 1);

      service.items$.subscribe((items) => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should not add with invalid quantity', (done) => {
      service.addProduct(mockProduct, -1);
      service.addProduct(mockProduct, 0);

      service.items$.subscribe((items) => {
        expect(items.length).toBe(0);
        done();
      });
    });
  });

  describe('removeProduct', () => {
    it('should remove product from cart', (done) => {
      service.addProduct(mockProduct, 1);
      service.removeProduct(mockProduct.id);

      service.items$.subscribe((items) => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should not affect other products', (done) => {
      service.addProduct(mockProduct, 1);
      service.addProduct(mockProduct2, 1);
      service.removeProduct(mockProduct.id);

      service.items$.subscribe((items) => {
        expect(items.length).toBe(1);
        expect(items[0].product.id).toBe(mockProduct2.id);
        done();
      });
    });
  });

  describe('Quantity methods', () => {
    beforeEach(() => {
      service.addProduct(mockProduct, 5);
    });

    it('should increase quantity', (done) => {
      service.increase(mockProduct.id, 2);

      service.items$.subscribe((items) => {
        expect(items[0].qty).toBe(7);
        done();
      });
    });

    it('should decrease quantity', (done) => {
      service.decrease(mockProduct.id, 2);

      service.items$.subscribe((items) => {
        expect(items[0].qty).toBe(3);
        done();
      });
    });

    it('should remove product when quantity becomes 0', (done) => {
      service.decrease(mockProduct.id, 5);

      service.items$.subscribe((items) => {
        expect(items.length).toBe(0);
        done();
      });
    });

    it('should set specific quantity', (done) => {
      service.setQuantity(mockProduct.id, 10);

      service.items$.subscribe((items) => {
        expect(items[0].qty).toBe(10);
        done();
      });
    });
  });

  describe('Totals', () => {
    it('should calculate total price', (done) => {
      service.addProduct(mockProduct, 2);
      service.addProduct(mockProduct2, 1);

      service.total$.subscribe((total) => {
        // (2.99 * 2) + (4.99 * 1) = 5.98 + 4.99 = 10.97
        expect(total).toBeCloseTo(10.97, 2);
        done();
      });
    });

    it('should calculate item count', (done) => {
      service.addProduct(mockProduct, 2);
      service.addProduct(mockProduct2, 3);

      service.count$.subscribe((count) => {
        expect(count).toBe(5);
        done();
      });
    });
  });

  describe('Overlay control', () => {
    it('should open overlay', (done) => {
      service.open();

      service.open$.subscribe((isOpen) => {
        expect(isOpen).toBe(true);
        done();
      });
    });

    it('should close overlay', (done) => {
      service.open();
      service.close();

      service.open$.subscribe((isOpen) => {
        expect(isOpen).toBe(false);
        done();
      });
    });
  });

  describe('Clear cart', () => {
    it('should clear all items', (done) => {
      service.addProduct(mockProduct, 2);
      service.addProduct(mockProduct2, 1);
      service.clear();

      service.items$.subscribe((items) => {
        expect(items.length).toBe(0);
        done();
      });
    });
  });

  describe('Checkout payload', () => {
    it('should build checkout payload', () => {
      service.addProduct(mockProduct, 2);
      service.addProduct(mockProduct2, 1);

      const payload = service.buildCheckoutPayload();

      expect(payload).toEqual([
        { productId: 1, qty: 2 },
        { productId: 2, qty: 1 },
      ]);
    });
  });
});
