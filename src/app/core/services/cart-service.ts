import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CartItem } from '../../features/menu/models/cart-item.model';
import { Product } from '../../features/menu/models/product.model';

const STORAGE_KEY = 'app_cart_v1';

@Injectable({ providedIn: 'root' })
export class CartService {
  private itemsSubject = new BehaviorSubject<CartItem[]>(this.loadFromStorage());
  items$ = this.itemsSubject.asObservable();

  // Overlay control (open/close) — para que el componente use cart.open$ y cart.close()
  private openSubject = new BehaviorSubject<boolean>(false);
  open$ = this.openSubject.asObservable();

  // Derived observables
  total$: Observable<number> = this.items$.pipe(
    map(items => this.computeTotal(items))
  );

  count$: Observable<number> = this.items$.pipe(
    map(items => this.computeCount(items))
  );

  private loadFromStorage(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed: CartItem[] = JSON.parse(raw);
      return parsed.map(p => ({ product: p.product, qty: Number(p.qty) || 1 }));
    } catch {
      return [];
    }
  }

  private saveToStorage(items: CartItem[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Cart save error', e);
    }
  }

  private computeTotal(items: CartItem[]) {
    return items.reduce((acc, it) => acc + (Number(it.product.price || 0) * it.qty), 0);
  }

  private computeCount(items: CartItem[]) {
    return items.reduce((acc, it) => acc + it.qty, 0);
  }

  // Public API
  getItemsSnapshot(): CartItem[] {
    return this.itemsSubject.value;
  }

  addProduct(product: Product, qty = 1) {
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

  setQuantity(productId: number, qty: number) {
    if (qty <= 0) {
      this.removeProduct(productId);
      return;
    }
    const items = this.itemsSubject.value.map(it => it.product.id === productId ? { ...it, qty } : it);
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  increase(productId: number, amount = 1) {
    const items = this.itemsSubject.value.map(it => it.product.id === productId ? { ...it, qty: it.qty + amount } : it);
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  decrease(productId: number, amount = 1) {
    const current = this.itemsSubject.value.find(it => it.product.id === productId);
    if (!current) return;
    const newQty = current.qty - amount;
    if (newQty <= 0) {
      this.removeProduct(productId);
      return;
    }
    this.setQuantity(productId, newQty);
  }

  removeProduct(productId: number) {
    const items = this.itemsSubject.value.filter(it => it.product.id !== productId);
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  clear() {
    this.itemsSubject.next([]);
    localStorage.removeItem(STORAGE_KEY);
  }

  // Useful for checkout: return a serializable payload
  buildCheckoutPayload() {
    return this.itemsSubject.value.map(it => ({ productId: it.product.id, qty: it.qty }));
  }

  // -----------------------
  // Overlay control methods
  // -----------------------
  open() {
    this.openSubject.next(true);
  }

  close() {
    this.openSubject.next(false);
  }

  toggle() {
    this.openSubject.next(!this.openSubject.value);
  }
}
