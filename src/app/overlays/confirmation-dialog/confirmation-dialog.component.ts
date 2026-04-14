import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, transition, style, animate } from '@angular/animations';
import { ConfirmationService } from '../../core/services/confirmation.service';

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (confirmationService.isOpen()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
           [@fadeIn]
           (click)="confirmationService.cancelAction()">
        <!-- Overlay -->
        <div class="absolute inset-0 bg-black/50"></div>

        <!-- Dialog -->
        <div class="relative bg-surface rounded-xl shadow-2xl max-w-md w-full p-6 z-10"
             [@slideUp]
             (click)="$event.stopPropagation()">
          
          <!-- Icono según tipo -->
          @if (confirmationService.data(); as data) {
            <div class="flex justify-center mb-4">
              @switch (data.type || 'warning') {
                @case ('danger') {
                  <div class="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10">
                    <span class="material-icons text-2xl text-red-500">error</span>
                  </div>
                }
                @case ('warning') {
                  <div class="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500/10">
                    <span class="material-icons text-2xl text-yellow-500">warning</span>
                  </div>
                }
                @case ('info') {
                  <div class="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10">
                    <span class="material-icons text-2xl text-blue-500">info</span>
                  </div>
                }
              }
            </div>

            <!-- Contenido -->
            <div class="text-center mb-6">
              <h2 class="text-lg font-bold text-text-primary mb-2">{{ data.title }}</h2>
              <p class="text-sm text-text-secondary">{{ data.message }}</p>
            </div>

            <!-- Botones -->
            <div class="flex gap-3">
              <button
                type="button"
                (click)="confirmationService.cancelAction()"
                class="flex-1 px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:bg-surface transition font-medium">
                {{ data.cancelText || 'Cancelar' }}
              </button>
              <button
                type="button"
                (click)="confirmationService.confirmAction()"
                [class]="getConfirmButtonClass(data.type)"
                class="flex-1 px-4 py-2.5 rounded-lg text-white transition font-semibold">
                {{ data.confirmText || 'Confirmar' }}
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ]),
    trigger('slideUp', [
      transition(':enter', [
        style({ transform: 'translateY(20px)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ transform: 'translateY(20px)', opacity: 0 }))
      ])
    ])
  ]
})
export class ConfirmationDialogComponent {
  protected readonly confirmationService = inject(ConfirmationService);

  protected getConfirmButtonClass(type?: string): string {
    switch (type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600';
      case 'warning':
        return 'bg-yellow-500 hover:bg-yellow-600';
      case 'info':
        return 'bg-blue-500 hover:bg-blue-600';
      default:
        return 'bg-primary hover:opacity-90';
    }
  }
}
