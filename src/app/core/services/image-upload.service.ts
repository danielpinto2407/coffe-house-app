import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ImageOptimizationService } from './image-optimization.service';
import { NotificationService } from './notification.service';
import { StorageMonitoringService } from './storage-monitoring.service';

/**
 * ✅ Interfaz para progreso de carga
 */
export interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  isUploading: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImageUploadService {
  private readonly supabase = inject(SupabaseService);
  private readonly imageOpt = inject(ImageOptimizationService);
  private readonly notification = inject(NotificationService);
  private readonly storageMonitoring = inject(StorageMonitoringService);

  private readonly BUCKET_NAME = 'menu';
  private readonly UPLOAD_FOLDER = 'products'; // Subfolder: products/

  // Signals para tracking de estado
  uploading = signal<UploadProgress | null>(null);

  /**
   * ✅ Sube una imagen optimizada a Supabase Storage
   * 
   * Flujo:
   * 1. Validar almacenamiento disponible
   * 2. Comprimir imagen
   * 3. Subir a Supabase
   * 4. Retornar URL pública
   * 
   * @param file - Archivo del usuario
   * @param productId - ID del producto (opcional). Si existe, la imagen usará nombre fijo: product-{id}.jpg y se pisará al actualizar
   * @returns Promise con URL pública de la imagen
   * @throws Error si algo falla
   */
  async uploadProductImage(file: File, productId?: number): Promise<string> {
    // ✅ Si hay productId, usar nombre fijo para que se pise al actualizar
    // Si no, generar nombre único (para productos nuevos)
    const fileName = productId 
      ? `product-${productId}${this.getFileExtension(file.name)}`
      : this.imageOpt.generateUniqueFileName(file.name, 'product');
    
    this.uploading.set({
      fileName,
      progress: 5,
      isUploading: true,
    });

    try {
      // -1️⃣ VALIDAR ALMACENAMIENTO
      this.uploading.update(prev => prev ? { ...prev, progress: 10 } : null);
      
      const hasSpace = await this.storageMonitoring.validateSpaceAvailable(file.size);
      if (!hasSpace) {
        throw new Error(
          '❌ No hay espacio de almacenamiento disponible. ' +
          'Se ha alcanzado el límite de 1GB. Elimina imágenes antiguas o actualiza tu plan.'
        );
      }

      // ⚠️ COMPROBAR LÍMITE (80%)
      const stats = await this.storageMonitoring.getStorageStats();
      const warning = this.storageMonitoring.getStorageWarning();
      if (warning) {
        this.notification.warning(warning);
      }

      // 1️⃣ OPTIMIZAR IMAGEN
      this.uploading.update(prev => prev ? { ...prev, progress: 30 } : null);
      const compressedBlob = await this.imageOpt.optimizeImage(file);
      const savings = this.imageOpt.calculateSavings(file.size, compressedBlob.size);
      console.log(`✅ Compresión: guardó ${savings} de espacio`);

      // 2️⃣ SUBIR A SUPABASE
      this.uploading.update(prev => prev ? { ...prev, progress: 60 } : null);
      const remotePath = `${this.UPLOAD_FOLDER}/${fileName}`;
      const fullPath = await this.uploadBlob(compressedBlob, remotePath);

      // 3️⃣ GENERAR URL PÚBLICA
      this.uploading.update(prev => prev ? { ...prev, progress: 90 } : null);
      const publicUrl = this.getPublicUrl(fullPath);

      this.uploading.update(prev => prev ? { ...prev, progress: 100 } : null);
      
      // 4️⃣ NOTIFICAR ÉXITO
      this.notification.success(
        `✅ Imagen subida exitosamente (${(compressedBlob.size / 1024).toFixed(0)}KB)`
      );

      // Reset
      setTimeout(() => this.uploading.set(null), 1000);

      return publicUrl;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      this.uploading.update(prev => 
        prev ? { ...prev, error: errorMsg, isUploading: false } : null
      );
      this.notification.error(`Fallo en carga: ${errorMsg}`);
      throw error;
    }
  }

  /**
   * ✅ Subir múltiples imágenes (para admin batch)
   */
  async uploadMultipleImages(files: File[]): Promise<string[]> {
    const results: string[] = [];

    for (const file of files) {
      try {
        const url = await this.uploadProductImage(file);
        results.push(url);
      } catch (error) {
        console.error(`Error subiendo ${file.name}:`, error);
        // Continuar con siguientes archivos
      }
    }

    return results;
  }

  /**
   * ✅ Sube el Blob a Supabase
   */
  private async uploadBlob(blob: Blob, remotePath: string): Promise<string> {
    const supabaseClient = this.supabase.getSupabaseClient();

    const { data, error } = await supabaseClient.storage
      .from(this.BUCKET_NAME)
      .upload(remotePath, blob, {
        contentType: 'image/webp', // Siempre optimizamos a WebP
        upsert: false, // No sobrescribir si existe
        cacheControl: '31536000', // 1 año (revisión por timestamp en URL)
      });

    if (error) {
      throw new Error(`Supabase upload error: ${error.message}`);
    }

    return data.path;
  }

  /**
   * ✅ Retorna URL pública de la imagen
   */
  private getPublicUrl(remotePath: string): string {
    const supabaseClient = this.supabase.getSupabaseClient();
    const { data } = supabaseClient.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(remotePath);

    return data.publicUrl;
  }

  /**
   * ✅ Obtiene la extensión de un archivo de manera segura
   */
  private getFileExtension(fileName: string): string {
    const match = fileName.match(/\.[^.]*$/);
    return match ? match[0] : '.jpg';
  }

  /**
   * ✅ Obtiene URL optimizada con srcset para responsive
   */
  getOptimizedUrl(imagePath: string): string {
    const supabaseClient = this.supabase.getSupabaseClient();
    const { data } = supabaseClient.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(imagePath);

    // Agregar timestamp como cache buster
    return `${data.publicUrl}?t=${Date.now()}`;
  }
}
