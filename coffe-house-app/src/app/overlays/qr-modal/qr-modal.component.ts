import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente modal para visualizar código QR del menú
 * Muestra: QR, URL del PDF, botones de descargar/cerrar
 * 
 * @example
 * <app-qr-modal 
 *   [isOpen]="modalOpen()"
 *   [qrCode]="qrCode()" 
 *   [pdfUrl]="pdfUrl()"
 *   [isLoading]="isLoading()"
 *   [error]="error()"
 *   (closed)="closeModal()">
 * </app-qr-modal>
 */
@Component({
  selector: 'app-qr-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- OVERLAY -->
    <div *ngIf="isOpen"
         class="fixed inset-0 bg-black/75 z-40 flex items-center justify-center"
         (click)="close()"
         role="presentation">
    </div>

    <!-- MODAL -->
    <div *ngIf="isOpen"
         class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-surface rounded-lg shadow-2xl p-8 max-w-md w-full"
           (click)="$event.stopPropagation()"
           role="dialog"
           aria-modal="true"
           aria-labelledby="qr-modal-title">

        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h2 id="qr-modal-title" class="text-2xl font-bold text-text">Menú QR</h2>
          <button type="button"
                  class="text-2xl text-text-secondary hover:text-text transition"
                  (click)="close()"
                  aria-label="Cerrar modal"
                  title="Cerrar (Esc)">
            ✕
          </button>
        </div>

        <!-- Contenido -->
        <div class="text-center">
          <!-- QR Code -->
          <div *ngIf="qrCode" class="mb-6 flex justify-center animate-in fade-in">
            <div class="relative">
              <img [src]="qrCode" 
                   alt="Código QR del menú" 
                   class="w-64 h-64 border-4 border-primary rounded-lg"
                   loading="lazy"
                   decoding="async">
              <!-- Badge: Usando caché si no está cargando -->
              <div *ngIf="!isLoading" 
                   class="absolute -bottom-2 -right-2 bg-success text-white text-xs font-bold 
                          px-3 py-1 rounded-full shadow-md">
                ✓ Listo
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div *ngIf="!qrCode && isLoading" class="mb-6">
            <div class="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"
                 role="status"
                 aria-label="Cargando"></div>
            <p class="text-text-secondary mt-4">Generando QR...</p>
          </div>

          <!-- Error -->
          <div *ngIf="error" 
               class="mb-6 p-4 bg-error/10 text-error rounded-lg"
               role="alert">
            <p class="text-sm font-medium">❌ Error</p>
            <p class="text-sm mt-1">{{ error }}</p>
          </div>

          <!-- URL -->
          <div *ngIf="pdfUrl" class="mb-6">
            <p class="text-text-secondary text-sm mb-2">URL del PDF:</p>
            <div class="bg-background-light p-3 rounded-lg break-all">
              <a [href]="pdfUrl" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 class="text-primary hover:text-accent text-xs underline"
                 [title]="pdfUrl">
                {{ truncateUrl(pdfUrl) }}
              </a>
            </div>
          </div>

          <!-- Botones -->
          <div class="flex gap-3">
            <button *ngIf="pdfUrl"
                    type="button"
                    (click)="downloadPdf()"
                    class="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-accent transition text-center"
                    title="Descarga el PDF a tu computadora">
              📥 Descargar PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class QrModalComponent {
  /**
   * Controla si el modal está visible
   */
  @Input() isOpen: boolean = false;

  /**
   * Código QR en formato Data URL (base64)
   */
  @Input() qrCode: string | null = null;

  /**
   * URL pública del PDF en Supabase
   */
  @Input() pdfUrl: string | null = null;

  /**
   * Indica si se está generando QR o cargando datos
   */
  @Input() isLoading: boolean = false;

  /**
   * Mensaje de error si algo falló
   */
  @Input() error: string | null = null;

  /**
   * Se emite cuando se cierra el modal
   */
  @Output() closed = new EventEmitter<void>();

  /**
   * Cierra el modal
   */
  close(): void {
    this.closed.emit();
  }

  /**
   * Trunca URL para mostrar en template
   * @param url - URL a truncar
   * @returns URL truncada con puntos suspensivos
   */
  truncateUrl(url: string | null): string {
    if (!url) return '';
    return url.length > 50 ? url.slice(0, 50) + '...' : url;
  }

  /**
   * Descarga el PDF desde Supabase como archivo
   * ✅ Descarga real, no abre en navegador
   */
  async downloadPdf(): Promise<void> {
    if (!this.pdfUrl) {
      console.warn('⚠️ No hay URL del PDF para descargar');
      return;
    }

    try {
      console.log('📥 Iniciando descarga del PDF...');
      const response = await fetch(this.pdfUrl);
      
      if (!response.ok) {
        throw new Error(`Error al descargar: ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // ✅ Crear elemento <a> temporal para descargar
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'menu-coffee-house.pdf';
      
      // ✅ Descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // ✅ Limpiar URL temporal
      URL.revokeObjectURL(link.href);
      
      console.log('✅ PDF descargado exitosamente');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error descargando PDF:', errorMsg);
    }
  }
}
