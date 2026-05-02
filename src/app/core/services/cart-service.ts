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
  readonly items$ = this.itemsSubject.asObservable();

  // Overlay control
  private readonly openSubject = new BehaviorSubject<boolean>(false);
  readonly open$ = this.openSubject.asObservable();

  // ✅ Derived observables
  readonly total$: Observable<number> = this.items$.pipe(
    map(items => this.computeTotal(items))
  );

  readonly count$: Observable<number> = this.items$.pipe(
    map(items => this.computeCount(items))
  );

  /**
   * ✅ SSR-SAFE: Solo accede a sessionStorage en el cliente (no en servidor)
   * Usa sessionStorage para que el carrito se vacíe al cerrar la pestaña
   */
  private loadFromStorage(): CartItem[] {
    try {
      // ✅ Guard: comprueba si estamos en el cliente (window existe)
      if (globalThis.window === undefined || !this.doc.defaultView) {
        return [];
      }

      const raw = globalThis.window.sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return [];

      const parsed: CartItem[] = JSON.parse(raw);
      return parsed.map(p => ({ product: p.product, qty: Math.max(1, Number(p.qty) || 1) }));
    } catch (e) {
      return [];
    }
  }

  /**
   * ✅ SSR-SAFE: Solo guarda en sessionStorage en el cliente
   * Usa sessionStorage para que el carrito se vacíe al cerrar la pestaña
   */
  private saveToStorage(items: CartItem[]): void {
    try {
      if (globalThis.window === undefined || !this.doc.defaultView) {
        return; // No guardar en servidor
      }
      globalThis.window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      // sessionStorage error - continue
    }
  }

  private computeTotal(items: CartItem[]): number {
    return items.reduce((acc, it) => {
      // Si el item tiene finalPrice (con adiciones), usar ese; si no, usar precio del producto
      const itemPrice = it.finalPrice ?? (Number(it.product.price || 0));
      return acc + (itemPrice * it.qty);
    }, 0);
  }

  private computeCount(items: CartItem[]): number {
    return items.reduce((acc, it) => acc + it.qty, 0);
  }

  // ========== PUBLIC API ==========

  /**
   * Obtiene snapshot actual del carrito
   */
  getItemsSnapshot(): CartItem[] {
    return this.itemsSubject.value;
  }

  /**
   * Añade producto al carrito o incrementa cantidad si ya existe
   * @param product Producto a agregar
   * @param qty Cantidad
   * @param selectedAdditions Adiciones seleccionadas (opcional)
   * @param finalPrice Precio final con adiciones (opcional)
   */
  addProduct(
    product: Product | null | undefined,
    qty = 1,
    selectedAdditions: any[] = [],
    finalPrice?: number
  ): void {
    if (!product?.id || qty <= 0) return;

    const items = [...this.itemsSubject.value];

    // Buscar item existente con MISMAS adiciones (si las hay)
    let idx = -1;
    if (selectedAdditions.length > 0) {
      // Con adiciones - buscar por adiciones exactas
      idx = items.findIndex(it => 
        it.product.id === product.id &&
        it.selectedAdditions &&
        this.hasSameAdditions(it.selectedAdditions, selectedAdditions)
      );
    } else {
      // Sin adiciones - buscar por producto
      idx = items.findIndex(it => 
        it.product.id === product.id &&
        (!it.selectedAdditions || it.selectedAdditions.length === 0)
      );
    }

    const newItem: CartItem = {
      product,
      qty,
      selectedAdditions: selectedAdditions.length > 0 ? selectedAdditions : undefined,
      finalPrice: finalPrice || product.price
    };

    if (idx >= 0) {
      // Incrementar cantidad si el item con mismas adiciones ya existe
      items[idx].qty += qty;
    } else {
      // Agregar nuevo item
      items.push(newItem);
    }

    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  /**
   * Compara si dos arrays de adiciones son iguales
   */
  private hasSameAdditions(additions1: any[], additions2: any[]): boolean {
    if (additions1.length !== additions2.length) return false;
    const ids1 = additions1.map(a => a.id).sort();
    const ids2 = additions2.map(a => a.id).sort();
    return ids1.every((id, idx) => id === ids2[idx]);
  }

  /**
   * ✅ CENTRAL: Método unificado para actualizar cantidad
   * Es el punto de entrada para todas las modificaciones de cantidad
   */
  private updateQuantity(productId: number, qty: number): void {
    if (qty < 0) {
      return;
    }

    if (qty === 0) {
      this.removeProduct(productId);
      return;
    }

    const items = this.itemsSubject.value.map(it =>
      it.product.id === productId ? { ...it, qty } : it
    );

    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  /**
   * Establece cantidad específica para un producto
   */
  setQuantity(productId: number, qty: number): void {
    this.updateQuantity(productId, qty);
  }

  /**
   * Incrementa cantidad de un producto
   */
  increase(productId: number, amount = 1): void {
    const current = this.itemsSubject.value.find(it => it.product.id === productId);
    if (!current) return;
    this.updateQuantity(productId, current.qty + amount);
  }

  /**
   * Decrementa cantidad de un producto
   */
  decrease(productId: number, amount = 1): void {
    const current = this.itemsSubject.value.find(it => it.product.id === productId);
    if (!current) return;
    this.updateQuantity(productId, current.qty - amount);
  }

  /**
   * Elimina producto del carrito
   */
  removeProduct(productId: number): void {
    const items = this.itemsSubject.value.filter(it => it.product.id !== productId);
    this.itemsSubject.next(items);
    this.saveToStorage(items);
  }

  /**
   * Vacía el carrito completamente
   */
  clear(): void {
    this.itemsSubject.next([]);
    try {
      if (globalThis.window !== undefined) {
        globalThis.window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // localStorage error - continue
    }
  }

  /**
   * Retorna payload serializable para checkout
   */
  buildCheckoutPayload(): Array<{ productId: number; qty: number }> {
    return this.itemsSubject.value.map(it => ({
      productId: it.product.id,
      qty: it.qty
    }));
  }

  // ============= OVERLAY CONTROL =============

  /**
   * Abre el overlay del carrito
   */
  open(): void {
    this.openSubject.next(true);
  }

  /**
   * Cierra el overlay del carrito
   */
  close(): void {
    this.openSubject.next(false);
  }

  /**
   * Alterna visibilidad del overlay
   */
  toggle(): void {
    this.openSubject.next(!this.openSubject.value);
  }
}

