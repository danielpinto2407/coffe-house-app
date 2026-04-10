import { Injectable, signal, computed } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly notifications = signal<Notification[]>([]);
  private notificationCounter = 0;

  readonly notifications$ = computed(() => this.notifications());

  /**
   * Muestra una notificación de éxito
   */
  success(message: string, duration: number = 4000): void {
    this.show('success', message, duration);
  }

  /**
   * Muestra una notificación de error
   */
  error(message: string, duration: number = 5000): void {
    this.show('error', message, duration);
  }

  /**
   * Muestra una notificación de información
   */
  info(message: string, duration: number = 4000): void {
    this.show('info', message, duration);
  }

  /**
   * Muestra una notificación de advertencia
   */
  warning(message: string, duration: number = 4000): void {
    this.show('warning', message, duration);
  }

  /**
   * ✅ Método privado que maneja el flujo de notificaciones
   */
  private show(type: 'success' | 'error' | 'info' | 'warning', message: string, duration: number): void {
    const id = `notification-${++this.notificationCounter}`;
    const notification: Notification = { id, type, message, duration };

    // Agregar notificación
    this.notifications.update(current => [...current, notification]);

    // Auto-remover después de duration
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
  }

  /**
   * Elimina una notificación por ID
   */
  remove(id: string): void {
    this.notifications.update(current => current.filter(n => n.id !== id));
  }

  /**
   * Limpia todas las notificaciones
   */
  clear(): void {
    this.notifications.set([]);
  }
}
