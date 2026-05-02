import { Injectable, inject } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { SupabaseService } from './supabase.service';
import { ProductAddition } from '../../features/menu/models/product-addition.model';

@Injectable({ providedIn: 'root' })
export class AdditionsService {
  private readonly supabase = inject(SupabaseService);
  
  private readonly additionsSubject = new BehaviorSubject<ProductAddition[]>([]);
  readonly additions$ = this.additionsSubject.asObservable();

  /**
   * Obtiene todas las adiciones
   */
  getAllAdditions(): Observable<ProductAddition[]> {
    return from(
      this.supabase.client
        .from('additions')
        .select('*')
        .order('order')
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          console.error('Error fetching additions:', error);
          return [];
        }
        return (data || []) as ProductAddition[];
      }),
      tap(additions => this.additionsSubject.next(additions)),
      catchError(error => {
        console.error('Error in getAllAdditions:', error);
        return from([[]]);
      })
    );
  }

  /**
   * Obtiene una adición por ID
   */
  getAdditionById(id: number): Observable<ProductAddition | undefined> {
    return from(
      this.supabase.client
        .from('additions')
        .select('*')
        .eq('id', id)
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) {
          console.error('Error fetching addition:', error);
          return undefined;
        }
        return data as ProductAddition;
      }),
      catchError(error => {
        console.error('Error in getAdditionById:', error);
        return from([undefined]);
      })
    );
  }

  /**
   * Crea una nueva adición
   */
  createAddition(addition: Omit<ProductAddition, 'id'>): Observable<ProductAddition> {
    return from(
      this.supabase.client
        .from('additions')
        .insert([addition])
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(`Error creating addition: ${error.message}`);
        return data as ProductAddition;
      }),
      tap(() => this.getAllAdditions().subscribe()),
      catchError(error => {
        console.error('Error in createAddition:', error);
        throw error;
      })
    );
  }

  /**
   * Actualiza una adición existente
   */
  updateAddition(id: number, updates: Partial<ProductAddition>): Observable<ProductAddition> {
    return from(
      this.supabase.client
        .from('additions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    ).pipe(
      map(({ data, error }) => {
        if (error) throw new Error(`Error updating addition: ${error.message}`);
        return data as ProductAddition;
      }),
      tap(() => this.getAllAdditions().subscribe()),
      catchError(error => {
        console.error('Error in updateAddition:', error);
        throw error;
      })
    );
  }

  /**
   * Elimina una adición
   */
  deleteAddition(id: number): Observable<void> {
    return from(
      this.supabase.client
        .from('additions')
        .delete()
        .eq('id', id)
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(`Error deleting addition: ${error.message}`);
      }),
      tap(() => this.getAllAdditions().subscribe()),
      catchError(error => {
        console.error('Error in deleteAddition:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene adiciones para un producto específico
   */
  getAdditionsForProduct(productId: number): Observable<ProductAddition[]> {
    return from(
      this.supabase.client
        .from('product_additions')
        .select('addition_id, additions(*)')
        .eq('product_id', productId)
    ).pipe(
      map(({ data, error }) => {
        if (error || !data) return [];
        return (data as any[])
          .filter(item => item.additions)
          .map(item => item.additions as ProductAddition);
      }),
      catchError(error => {
        console.error('Error in getAdditionsForProduct:', error);
        return from([[]]);
      })
    );
  }

  /**
   * Asocia una adición a un producto
   */
  addAdditionToProduct(
    productId: number,
    additionId: number,
    required: boolean = false,
    maxSelections: number = 1
  ): Observable<void> {
    return from(
      this.supabase.client
        .from('product_additions')
        .insert([{
          product_id: productId,
          addition_id: additionId,
          required,
          max_selections: maxSelections,
        }])
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(`Error adding addition to product: ${error.message}`);
      }),
      catchError(error => {
        console.error('Error in addAdditionToProduct:', error);
        throw error;
      })
    );
  }

  /**
   * Remueve una adición de un producto
   */
  removeAdditionFromProduct(productId: number, additionId: number): Observable<void> {
    return from(
      this.supabase.client
        .from('product_additions')
        .delete()
        .eq('product_id', productId)
        .eq('addition_id', additionId)
    ).pipe(
      map(({ error }) => {
        if (error) throw new Error(`Error removing addition: ${error.message}`);
      }),
      catchError(error => {
        console.error('Error in removeAdditionFromProduct:', error);
        throw error;
      })
    );
  }
}
