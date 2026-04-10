import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-notification-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div
        *ngFor="let notification of notificationService.notifications$(); trackBy: trackById"
        [@slideIn]
        class="notification pointer-events-auto"
        [ngClass]="'notification-' + notification.type">
        <div class="flex items-center gap-3 p-4 rounded-lg shadow-lg">
          <!-- Icono según tipo -->
          <span class="material-icons text-lg" [ngClass]="getIconClass(notification.type)">
            {{ getIcon(notification.type) }}
          </span>
          
          <!-- Mensaje -->
          <p class="text-sm font-medium flex-1">{{ notification.message }}</p>
          
          <!-- Botón cerrar -->
          <button
            (click)="notificationService.remove(notification.id)"
            class="material-icons text-lg cursor-pointer hover:opacity-70 transition"
            aria-label="Cerrar">
            close
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-success {
      @apply bg-green-100 text-green-800 border-l-4 border-green-500;
    }

    .notification-error {
      @apply bg-red-100 text-red-800 border-l-4 border-red-500;
    }

    .notification-info {
      @apply bg-blue-100 text-blue-800 border-l-4 border-blue-500;
    }

    .notification-warning {
      @apply bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500;
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationContainerComponent {
  protected readonly notificationService = inject(NotificationService);

  getIcon(type: 'success' | 'error' | 'info' | 'warning'): string {
    return {
      success: 'check_circle',
      error: 'error',
      info: 'info',
      warning: 'warning'
    }[type];
  }

  getIconClass(type: 'success' | 'error' | 'info' | 'warning'): string {
    return {
      success: 'text-green-600',
      error: 'text-red-600',
      info: 'text-blue-600',
      warning: 'text-yellow-600'
    }[type];
  }

  trackById(index: number, notification: any): string {
    return notification.id;
  }
}
