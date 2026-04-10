import { Injectable } from '@angular/core';
import * as QRCode from 'qrcode';

@Injectable({ providedIn: 'root' })
export class QrGeneratorService {
  /**
   * Genera un código QR en formato de URL de datos
   * @param text - Texto o URL a codificar
   * @returns URL de datos con la imagen QR
   */
  async generateQr(text: string): Promise<string> {
    try {
      const qrDataUrl = await QRCode.toDataURL(text, {
        errorCorrectionLevel: 'H',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrDataUrl;
    } catch {
      throw new Error('No se pudo generar el código QR');
    }
  }

  /**
   * Descarga el QR como imagen PNG
   * @param qrDataUrl - URL de datos del QR
   * @param fileName - Nombre del archivo a descargar
   */
  downloadQr(qrDataUrl: string, fileName: string = 'menu-qr.png'): void {
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
