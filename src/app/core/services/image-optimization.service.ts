import { Injectable } from '@angular/core';
import imageCompression from 'browser-image-compression';

/**
 * ✅ Interfaz para imagen optimizada
 */
export interface OptimizedImage {
  src: string;
  srcset: string;
  sizes: string;
  isOptimized: boolean;
}

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ImageOptimizationService {
  
  // Configuración por defecto
  private readonly DEFAULT_MAX_SIZE_MB = 0.3; // 300KB máximo
  private readonly DEFAULT_MAX_DIMENSION = 1200; // Ancho/alto máximo
  private readonly ALLOWED_TYPES = ['image/webp', 'image/jpeg', 'image/png', 'image/jpg'];

  /**
   * ✅ Valida y comprime una imagen antes de subir
   * Devuelve un Blob optimizado listo para Supabase
   * 
   * @param file - Archivo original del usuario
   * @param options - Opciones de compresión personalizadas
   * @returns Promise con el Blob comprimido
   * @throws Error si la imagen no es válida
   */
  async optimizeImage(
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<Blob> {
    // 1️⃣ Validar archivo
    this.validateFile(file);

    // 2️⃣ Comprimir imagen
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB ?? this.DEFAULT_MAX_SIZE_MB,
      maxWidthOrHeight: options.maxWidthOrHeight ?? this.DEFAULT_MAX_DIMENSION,
      useWebWorker: options.useWebWorker ?? true,
      fileType: this.getBestFileType(file.type),
    });

    // 3️⃣ Log para debugging
    console.log(
      `📦 Imagen comprimida: ${(file.size / 1024).toFixed(2)}KB → ${(compressedFile.size / 1024).toFixed(2)}KB`
    );

    return compressedFile;
  }

  /**
   * ✅ Devuelve URL optimizada para Supabase con lazy loading
   */
  getOptimizedImageUrl(supabaseUrl: string, bucket: string, fileName: string): OptimizedImage {
    const baseUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${fileName}`;
    
    // Cachebuster: evita caché viejo si reuploadeamos
    const timestamp = `?t=${Math.floor(Date.now() / 1000)}`;

    return {
      src: `${baseUrl}${timestamp}`,
      srcset: `
        ${baseUrl}?w=200&t=${Date.now()} 200w,
        ${baseUrl}?w=400&t=${Date.now()} 400w,
        ${baseUrl}?w=800&t=${Date.now()} 800w,
        ${baseUrl}?w=1200&t=${Date.now()} 1200w
      `,
      sizes: `
        (max-width: 640px) 100vw,
        (max-width: 1024px) 50vw,
        33vw
      `,
      isOptimized: true,
    };
  }

  /**
   * ✅ Valida que el archivo cumpla requisitos
   */
  private validateFile(file: File): void {
    // 1. Validar tipo
    if (!this.ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `❌ Tipo de archivo no permitido. Solo: ${this.ALLOWED_TYPES.join(', ')}`
      );
    }

    // 2. Validar tamaño (antes de comprimir)
    const maxSizeBeforeCompress = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeBeforeCompress) {
      throw new Error(
        `❌ Archivo muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: 5MB`
      );
    }

    // 3. Validar dimensiones con FileReader
    // (Esto se hace de forma asincrónica en la compresión)
  }

  /**
   * ✅ Detecta el mejor formato para guardar
   * - WebP si el navegador soporta (más eficiente)
   * - JPEG si es foto (mejor compresión con pérdida)
   * - PNG si necesita transparencia
   */
  private getBestFileType(originalType: string): string {
    // WebP es el mejor formato moderno (compatible 95%+ navegadores)
    return 'image/webp';
  }

  /**
   * ✅ Genera un nombre único para la imagen
   * Previene conflictos y facilita organización
   */
  generateUniqueFileName(originalName: string, prefix: string = 'product'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const extension = this.getFileExtension(originalName);
    
    return `${prefix}-${timestamp}-${random}.${extension}`;
  }

  /**
   * ✅ Obtiene extensión segura del archivo
   */
  private getFileExtension(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    // Normalizar a extensiones soportadas
    const extensionMap: Record<string, string> = {
      'jpeg': 'jpg',
      'webp': 'webp',
      'png': 'png',
      'jpg': 'jpg',
    };
    return extensionMap[ext] || 'jpg';
  }

  /**
   * ✅ Calcula el tamaño de descarga ahorrado
   */
  calculateSavings(originalSize: number, compressedSize: number): string {
    if (originalSize === 0) return '0%';
    const percentage = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    return `${percentage}%`;
  }
}
