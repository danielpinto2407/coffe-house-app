import { Injectable, signal, computed, inject } from '@angular/core';
import { SupabaseService } from '../../../core/services/supabase.service';
import { QrCodeService } from './qr-code.service';

/**
 * Servicio para gestionar estado de generación de PDF y codigos QR
 * Orquesta la carga de PDFs a Supabase y generación de códigos QR
 */
@Injectable({
  providedIn: 'root'
})
export class MenuPdfStateService {
  private readonly supabaseService = inject(SupabaseService);
  private readonly qrCodeService = inject(QrCodeService);
  private readonly qrFileName = 'menu-qr.png';

  // Signals para el estado - privados para evitar mutaciones externas
  private readonly _pdfUrl = signal<string | null>(null);
  private readonly _qrCode = signal<string | null>(null);
  private readonly _isLoadingPdf = signal(false);
  private readonly _isLoadingQr = signal(false);
  private readonly _error = signal<string | null>(null);

  // Read-only públicos — asReadonly() evita wrappers computed() innecesarios
  readonly pdfUrl = this._pdfUrl.asReadonly();
  readonly qrCode = this._qrCode.asReadonly();
  readonly isLoadingPdf = this._isLoadingPdf.asReadonly();
  readonly isLoadingQr = this._isLoadingQr.asReadonly();
  readonly error = this._error.asReadonly();
  // Computed reales: derivan de múltiples signals (estos sí justifican computed)
  readonly hasPdf = computed(() => this._pdfUrl() !== null);
  readonly hasQr = computed(() => this._qrCode() !== null);
  readonly isLoading = computed(() => this._isLoadingPdf() || this._isLoadingQr());

  /**
   * Sube el PDF a Supabase (sobrescribiendo el anterior) y genera un QR de la URL pública
   * @param pdfBlob - Blob del PDF a subir
   * @throws Error si falla la carga o generación del QR
   */
  async uploadPdfAndGenerateQr(pdfBlob: Blob): Promise<void> {
    if (!pdfBlob?.size) {
      this._error.set('PDF vacío o inválido');
      throw new Error('PDF vacío o inválido');
    }

    try {
      this._isLoadingPdf.set(true);
      this._error.set(null);

      // ✅ Usar nombre fijo (no timestamp) para siempre sobrescribir el mismo archivo
      const fileName = 'menu.pdf';

      // Subir PDF a Supabase (sobrescribe si existe)
      const publicUrl = await this.supabaseService.uploadPdf(fileName, pdfBlob);
      this._pdfUrl.set(publicUrl);

      // Generar QR con la URL del PDF
      this._isLoadingQr.set(true);
      const qrDataUrl = await this.qrCodeService.generateQRCode(publicUrl);
      this._qrCode.set(qrDataUrl);

      console.log('✅ PDF cargado a Supabase y QR generado');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this._error.set(errorMsg);
      console.error('❌ Error uploadPdfAndGenerateQr:', errorMsg);
      throw error;
    } finally {
      this._isLoadingPdf.set(false);
      this._isLoadingQr.set(false);
    }
  }

  /**
   * Regenera el código QR desde la URL del PDF existente
   * Útil si el PDF ya está cargado pero el QR se perdió
   * @throws Error si no hay URL de PDF o falla la generación del QR
   */
  async generateMenuQr(): Promise<void> {
    const currentPdfUrl = this._pdfUrl();
    
    if (!currentPdfUrl?.trim()) {
      const errorMsg = 'No hay URL de PDF disponible para generar QR';
      this._error.set(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      this._isLoadingQr.set(true);
      this._error.set(null);

      const qrDataUrl = await this.qrCodeService.generateQRCode(currentPdfUrl);
      this._qrCode.set(qrDataUrl);

      console.log('✅ QR regenerado exitosamente');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      this._error.set(message);
      console.error('❌ Error generateMenuQr:', message);
      throw error;
    } finally {
      this._isLoadingQr.set(false);
    }
  }

  /**
   * Carga el PDF existente desde Supabase sin generar uno nuevo
   * @throws Error si el PDF no existe o falla la generación del QR
   */
  async loadExistingPdfAndQr(): Promise<void> {
    try {
      this._isLoadingPdf.set(true);
      this._error.set(null);

      // ✅ Cargar URL del PDF existente (nombre fijo: menu.pdf)
      const publicUrl = await this.supabaseService.getPdfUrl('menu.pdf');
      this._pdfUrl.set(publicUrl);

      // Generar QR con la URL del PDF existente
      this._isLoadingQr.set(true);
      const qrDataUrl = await this.qrCodeService.generateQRCode(publicUrl);
      this._qrCode.set(qrDataUrl);

      console.log('✅ PDF existente cargado y QR generado');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'No hay menú disponible aún';
      this._error.set(errorMsg);
      console.warn('⚠️ Error loadExistingPdfAndQr:', errorMsg);
      throw error;
    } finally {
      this._isLoadingPdf.set(false);
      this._isLoadingQr.set(false);
    }
  }

  /**
   * Descarga el código QR generado como imagen PNG
   * Solo funciona en cliente (no en SSR)
   */
  downloadQr(): void {
    const currentQr = this._qrCode();
    
    if (!currentQr?.trim()) {
      this._error.set('No hay código QR disponible para descargar');
      console.warn('⚠️ No hay QR para descargar');
      return;
    }

    try {
      this.qrCodeService.downloadQRCode(currentQr, this.qrFileName);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this._error.set(errorMsg);
      console.error('❌ Error downloadQr:', errorMsg);
    }
  }

  /**
   * Limpia el estado completo (PDF, QR, errores)
   * Útil para limpiar después de un flujo completado
   */
  clearMenu(): void {
    this._pdfUrl.set(null);
    this._qrCode.set(null);
    this._error.set(null);
    this._isLoadingPdf.set(false);
    this._isLoadingQr.set(false);
    console.log('🧹 Estado del menú limpiado');
  }
}
