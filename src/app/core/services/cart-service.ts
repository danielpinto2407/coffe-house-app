import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem } from '../../features/menu/models/cart-item.model';
import { Product } from '../../features/menu/models/product.model';

const STORAGE_KEY = 'app_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly doc = inject(DOCUMENT);

  private readonly itemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  items$ = this.itemsSubject.asObservable();

  // Overlay control (open/close) — para que el componente use cart.open$ y cart.close()
  private readonly openSubject = new BehaviorSubject<boolean>(false);
  open$ = this.openSubject.asObservable();

  // Derived observables
  total$: Observable<number> = this.items$.pipe(
    map(items => this.computeTotal(items))
  );

  count$: Observable<number> = this.items$.pipe(
    map(items => this.computeCount(items))
  );

  /**
   * ✅ SSR-SAFE: Solo accede a localStorage en el cliente (no en servidor)
   */
  private loadFromStorage(): CartItem[] {
    try {
      // ✅ Guard: comprueba si estamos en el cliente (window existe)
      if (globalThis.window === undefined || !this.doc.defaultView) {
        return [];
      }

      const raw = globalThis.window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed: CartItem[] = JSON.parse(raw);
      return parsed.map(p => ({ product: p.product, qty: Number(p.qty) || 1 }));
    } catch (e) {
      console.warn('⚠️ Cart load error (SSR-safe):', e);
      return [];
    }
  }

  /**
   * ✅ SSR-SAFE: Solo guarda en localStorage en el cliente
   */
  private saveToStorage(items: CartItem[]): void {
    try {
      if (globalThis.window === undefined || !this.doc.defaultView) {
        return; // No guardar en servidor
      }
      globalThis.window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('⚠️ Cart save error (SSR-safe):', e);
    }
  }

  private computeTotal(items: CartItem[]): number {
    return items.reduce((acc, it) => acc + (Number(it.product.price || 0) * it.qty), 0);
  }

  private computeCount(items: CartItem[]): number {
    return items.reduce((acc, it) => acc + it.qty, 0);
  }

  // ========== PUBLIC API ==========

  getItemsSnapshot(): CartItem[] {
    return this.itemsSubject.value;
  }

  addProduct(product: Product, qty = 1): void {
    if (!product) return;
    const items = [...this.itemsSubject.value];
    const idx = items.findIndex(it => it.product.id === product.id);
    if (idx >= 0) {
      items[idx].qty += qty;
    } else {
      items.push({ product, qty });
    }
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  setQuantity(productId: number, qty: number): void {
    if (qty <= 0) {
      this.removeProduct(productId);
      return;
    }
    const items = this.itemsSubject.value.map(it =>
      it.product.id === productId ? { ...it, qty } : it
    );
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  increase(productId: number, amount = 1): void {
    const items = this.itemsSubject.value.map(it =>
      it.product.id === productId ? { ...it, qty: it.qty + amount } : it
    );
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  decrease(productId: number, amount = 1): void {
    const current = this.itemsSubject.value.find(it => it.product.id === productId);
    if (!current) return;
    const newQty = current.qty - amount;
    if (newQty <= 0) {
      this.removeProduct(productId);
      return;
    }
    this.setQuantity(productId, newQty);
  }

  removeProduct(productId: number): void {
    const items = this.itemsSubject.value.filter(it => it.product.id !== productId);
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  clear(): void {
    this.itemsSubject.next([]);
    try {
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('⚠️ Cart clear error:', e);
    }
  }

  /**
   * Useful for checkout: return a serializable payload
   */
  buildCheckoutPayload() {
    return this.itemsSubject.value.map(it => ({ productId: it.product.id, qty: it.qty }));
  }

  // ============= OVERLAY CONTROL =============

  open(): void {
    this.openSubject.next(true);
  }

  close(): void {
    this.openSubject.next(false);
  }

  toggle(): void {
    this.openSubject.next(!this.openSubject.value);
  }
}
