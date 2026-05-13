import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/**
 * ✅ Eventos de cambios en tiempo real desde Supabase
 */
export interface MenuChangeEvent {
  table: 'products' | 'categories' | 'subcategories';
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  recordId: number;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class MenuRealtimeService {
  private readonly supabase = inject(SupabaseService);
  private readonly destroyRef = inject(DestroyRef);

  // ✅ Signal para rastrear si la escucha está activa
  private readonly _isListening = signal(false);
  readonly isListening = computed(() => this._isListening());

  // ✅ Subject que emite eventos de cambios
  private readonly menuChangedSubject = new Subject<MenuChangeEvent>();
  readonly menuChanged$ = this.menuChangedSubject.asObservable();

  // ✅ Almacenar canales para limpiarlos después
  private channels: any[] = [];

  /**
   * ✅ Iniciar escucha en tiempo real de cambios en productos, categorías y subcategorías
   * SSR-safe: solo se ejecuta en el navegador
   */
  startListening(): void {
    // ✅ Proteger de SSR: No ejecutar en servidor
    if (typeof window === 'undefined' || !globalThis.window) {
      console.warn('[MenuRealtimeService] SSR detected, skipping realtime listening');
      return;
    }

    if (this._isListening()) {
      console.warn('[MenuRealtimeService] Ya está escuchando cambios');
      return;
    }

    try {
      this._isListening.set(true);

      // ✅ Escuchar cambios en tabla PRODUCTS
      this.subscribeToTable('products');

      // ✅ Escuchar cambios en tabla CATEGORIES
      this.subscribeToTable('categories');

      // ✅ Escuchar cambios en tabla SUBCATEGORIES
      this.subscribeToTable('subcategories');

      console.log('[MenuRealtimeService] ✅ Escucha de cambios iniciada');
    } catch (error) {
      console.error('[MenuRealtimeService] Error al iniciar escucha:', error);
      this._isListening.set(false);
    }
  }

  /**
   * ✅ Detener escucha y limpiar recursos
   */
  stopListening(): void {
    this.channels.forEach(channel => {
      try {
        this.supabase.client.removeChannel(channel);
      } catch (err) {
        console.warn('[MenuRealtimeService] Error al remover canal:', err);
      }
    });
    this.channels = [];
    this._isListening.set(false);
    console.log('[MenuRealtimeService] ✅ Escucha de cambios detenida');
  }

  /**
   * ✅ Helper: Suscribirse a una tabla específica
   */
  private subscribeToTable(
    tableName: 'products' | 'categories' | 'subcategories'
  ): void {
    const channel = this.supabase.client
      .channel(`public:${tableName}`)
      .on(
        'postgres_changes' as any,
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: tableName
        },
        (payload: any) => {
          // ✅ Emitir evento de cambio con metadata
          const event: MenuChangeEvent = {
            table: tableName,
            action: payload.eventType, // INSERT, UPDATE, DELETE
            recordId: payload.new?.id || payload.old?.id,
            timestamp: Date.now()
          };

          console.log(
            `[MenuRealtimeService] 🔄 Cambio detectado en ${tableName}:`,
            event
          );

          this.menuChangedSubject.next(event);
        }
      )
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          console.log(
            `[MenuRealtimeService] ✅ Suscrito a cambios en tabla: ${tableName}`
          );
        }
      });

    this.channels.push(channel);
  }

  /**
   * ✅ Obtener cambios filtrados solo para una tabla específica
   */
  getChangesForTable(
    tableName: 'products' | 'categories' | 'subcategories'
  ) {
    return this.menuChanged$.pipe(
      takeUntilDestroyed(this.destroyRef)
    );
  }
}
