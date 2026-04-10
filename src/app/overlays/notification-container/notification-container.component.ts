import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      <div *ngFor="let notif of notification.notifications$()" 
           [@slideIn]
           class="notification notification-{{ notif.type }} pointer-events-auto animate-fadeIn">
        <div class="flex items-center gap-3">
          <!-- Icono según tipo -->
          <span class="material-icons text-xl" [class]="getIconClass(notif.type)">
            {{ getIcon(notif.type) }}
          </span>
          
          <!-- Mensaje -->
          <p class="text-sm font-medium">{{ notif.message }}</p>
          
          <!-- Botón cerrar -->
          <button 
            (click)="notification.remove(notif.id)"
            class="ml-auto p-1 hover:bg-white/20 rounded transition">
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      --tw-translate-x: 0;
      --tw-translate-y: 0;
      --tw-rotate: 0;
      --tw-skew-x: 0;
      --tw-skew-y: 0;
      --tw-scale-x: 1;
      --tw-scale-y: 1;
    }

    .notification {
      @apply px-4 py-3 rounded-lg shadow-lg text-white font-medium max-w-sm backdrop-blur-sm transition-all;
    }

    .notification-success {
      @apply bg-green-500/95;
    }

    .notification-error {
      @apply bg-red-500/95;
    }

    .notification-info {
      @apply bg-blue-500/95;
    }

    .notification-warning {
      @apply bg-yellow-500/95;
    }

    @keyframes fadeIn {
      from {
        @apply opacity-0 translate-x-full;
      }
      to {
        @apply opacity-100 translate-x-0;
      }
    }

    .animate-fadeIn {
      animation: fadeIn 0.3s ease-out;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationContainerComponent {
  protected readonly notification = inject(NotificationService);

  /**
   * Retorna el icono según el tipo de notificación
   */
  getIcon(type: string): string {
    const icons: Record<string, string> = {
      success: 'check_circle',
      error: 'error',
      info: 'info',
      warning: 'warning'
    };
    return icons[type] || 'info';
  }

  /**
   * Retorna la clase de color según el tipo de notificación
   */
  getIconClass(type: string): string {
    const classes: Record<string, string> = {
      success: 'text-white',
      error: 'text-white',
      info: 'text-white',
      warning: 'text-white'
    };
    return classes[type] || 'text-white';
  }
}
