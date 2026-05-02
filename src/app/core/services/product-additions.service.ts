import { Injectable, inject } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ProductAddition, ProductAdditionsConfig } from '../../features/menu/models/product-addition.model';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ProductAdditionsService {
  private readonly supabase = inject(SupabaseService);

  /**
   * Obtiene las adiciones disponibles para un producto desde Supabase
   * Hace JOIN entre product_additions y additions
   */
  getAdditionsForProduct(productId: number): Observable<ProductAddition[]> {
    return from(
      this.supabase.client
        .from('product_additions')
        .select('addition_id, additions(id, name, price, order)')
        .eq('product_id', productId)
        .not('additions', 'is', null)
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching additions:', error);
          return [];
        }

        if (!data || data.length === 0) {
          return [];
        }

        return (data as any[])
          .filter((item: any) => item.additions)
          .map((item: any) => ({
            id: item.additions.id,
            name: item.additions.name,
            price: item.additions.price,
            order: item.additions.order || 999,
          } as ProductAddition))
          .sort((a: ProductAddition, b: ProductAddition) => a.order - b.order);
      }),
      catchError(error => {
        console.error('Error in getAdditionsForProduct:', error);
        return from([[]]);
      })
    );
  }

  /**
   * Obtiene configuración completa (incluyendo límites) para un producto desde Supabase
   */
  getConfigForProduct(productId: number): Observable<ProductAdditionsConfig | undefined> {
    return from(
      this.supabase.client
        .from('product_additions')
        .select('additions(id, name, price, order)')
        .eq('product_id', productId)
        .not('additions', 'is', null)
    ).pipe(
      map(({ data, error }) => {
        if (error || !data || data.length === 0) {
          return undefined;
        }

        const additions = (data as any[])
          .filter((item: any) => item.additions)
          .map((item: any) => ({
            id: item.additions.id,
            name: item.additions.name,
            price: item.additions.price,
            order: item.additions.order || 999,
          } as ProductAddition));

        return { productId, additions } as ProductAdditionsConfig;
      }),
      catchError(error => {
        console.error('Error in getConfigForProduct:', error);
        return from([undefined]);
      })
    );
  }

  calculateAdditionsPrice(additions: ProductAddition[]): number {
    return additions.reduce((total, addition) => total + addition.price, 0);
  }

  calculateFinalPrice(basePrice: number, selectedAdditions: ProductAddition[]): number {
    return basePrice + this.calculateAdditionsPrice(selectedAdditions);
  }
}
