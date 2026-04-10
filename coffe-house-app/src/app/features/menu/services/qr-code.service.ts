import { Injectable, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import * as QRCode from 'qrcode';

@Injectable({
  providedIn: 'root'
})
export class QrCodeService {
  private readonly doc = inject(DOCUMENT);

  /**
   * Genera un código QR en formato Data URL desde una URL
   * @param url - URL a codificar
   * @returns Promise con URL de datos del QR (base64)
   * @throws Error si la URL es inválida o falla la generación
   */
  async generateQRCode(url: string): Promise<string> {
    if (!url?.trim()) {
      throw new Error('URL inválida para generar QR');
    }

    try {
      const qrDataUrl = await QRCode.toDataURL(url);
      return qrDataUrl;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error generando QR:', errorMsg);
      throw new Error(`No se pudo generar el código QR: ${errorMsg}`);
    }
  }

  /**
   * Genera un código QR como Canvas (para renderizado en UI)
   * @param url - URL a codificar
   * @returns Promise con HTMLCanvasElement del QR
   * @throws Error si la URL es inválida, en SSR, o falla la generación
   */
  async generateQRCodeCanvas(url: string): Promise<HTMLCanvasElement> {
    if (!url?.trim()) {
      throw new Error('URL inválida para generar QR');
    }

    // SSR Safety: Proteger acceso a DOM
    if (typeof document === 'undefined' || !this.doc.defaultView) {
      throw new Error('Canvas no disponible en SSR');
    }

    try {
      const canvas = this.doc.createElement('canvas');
      await QRCode.toCanvas(canvas, url);
      return canvas;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error generando QR en canvas:', errorMsg);
      throw new Error(`No se pudo generar canvas QR: ${errorMsg}`);
    }
  }

  /**
   * Descarga el código QR como imagen PNG (solo en cliente)
   * @param qrDataUrl - URL de datos del QR (base64)
   * @param fileName - Nombre del archivo a descargar (default: 'qr-code.png')
   * @throws Error si la URL es inválida o falla la descarga
   * @note Solo funciona en cliente, en SSR registra advertencia y retorna
   */
  downloadQRCode(qrDataUrl: string, fileName: string = 'qr-code.png'): void {
    // SSR Safety: Solo ejecutar en cliente
    if (typeof document === 'undefined' || !this.doc.defaultView) {
      console.warn('⚠️ Descarga de QR no disponible en SSR');
      return;
    }

    if (!qrDataUrl?.trim()) {
      throw new Error('URL de datos del QR inválida');
    }

    try {
      const link = this.doc.createElement('a') as HTMLAnchorElement;
      link.href = qrDataUrl;
      link.download = fileName;
      (this.doc.body as HTMLBodyElement).appendChild(link);
      link.click();
      link.remove();
      console.log(`✅ QR descargado: ${fileName}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error descargando QR:', errorMsg);
      throw new Error(`No se pudo descargar QR: ${errorMsg}`);
    }
  }
}
