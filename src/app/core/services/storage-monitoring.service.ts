import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';

/**
 * ✅ Interfaz para estadísticas de almacenamiento
 */
export interface StorageStats {
  usedBytes: number;
  limitBytes: number;
  percentageUsed: number;
  filesCount: number;
  averageFileSize: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageMonitoringService {
  private readonly supabase = inject(SupabaseService);

  private readonly BUCKET_NAME = 'menu';
  private readonly UPLOAD_FOLDER = 'products';
  
  // 1GB en bytes (límite gratis de Supabase)
  private readonly FREE_TIER_LIMIT = 1 * 1024 * 1024 * 1024; // 1GB
  
  // Signals para estado
  storageStats = signal<StorageStats | null>(null);
  isLoading = signal(false);
  lastUpdated = signal<Date | null>(null);

  // Computed
  usagePercentage = computed(() => this.storageStats()?.percentageUsed || 0);
  isNearLimit = computed(() => (this.usagePercentage() > 80));
  canUpload = computed(() => {
    const stats = this.storageStats();
    if (!stats) return false;
    return stats.usedBytes < stats.limitBytes;
  });

  /**
   * ✅ Obtiene estadísticas actuales de almacenamiento
   * 
   * Calcula:
   * - Uso total en bytes
   * - Porcentaje utilizado
   * - Cantidad de archivos
   * - Tamaño promedio por archivo
   */
  async getStorageStats(): Promise<StorageStats> {
    this.isLoading.set(true);

    try {
      const supabaseClient = this.supabase.getSupabaseClient();

      // Listar archivos en carpeta products/
      const { data: files, error } = await supabaseClient.storage
        .from(this.BUCKET_NAME)
        .list(this.UPLOAD_FOLDER, {
          limit: 1000, // Máximo 1000 archivos por página
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        throw new Error(`Error al obtener lista de archivos: ${error.message}`);
      }

      // Calcular uso total
      let totalBytes = 0;
      let fileCount = 0;

      if (files && files.length > 0) {
        files.forEach(file => {
          if (file.metadata?.size) {
            totalBytes += file.metadata.size;
            fileCount++;
          }
        });
      }

      const stats: StorageStats = {
        usedBytes: totalBytes,
        limitBytes: this.FREE_TIER_LIMIT,
        percentageUsed: (totalBytes / this.FREE_TIER_LIMIT) * 100,
        filesCount: fileCount,
        averageFileSize: fileCount > 0 ? totalBytes / fileCount : 0,
      };

      this.storageStats.set(stats);
      this.lastUpdated.set(new Date());

      console.log('📊 Storage Stats:', stats);

      return stats;
    } catch (error) {
      console.error('❌ Error obteniendo storage stats:', error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * ✅ Valida si hay espacio suficiente para subir un archivo
   * 
   * @param fileSize - Tamaño del archivo en bytes
   * @returns true si hay espacio, false si no
   */
  async validateSpaceAvailable(fileSize: number): Promise<boolean> {
    try {
      const stats = await this.getStorageStats();
      
      const hasSpace = stats.usedBytes + fileSize <= stats.limitBytes;
      
      if (!hasSpace) {
        console.warn(
          `❌ Espacio insuficiente. Usado: ${this.formatBytes(stats.usedBytes)}, ` +
          `Necesario: ${this.formatBytes(fileSize)}, ` +
          `Disponible: ${this.formatBytes(stats.limitBytes - stats.usedBytes)}`
        );
      }

      return hasSpace;
    } catch (error) {
      console.error('❌ Error validando espacio:', error);
      return false;
    }
  }

  /**
   * ✅ Obtiene alerta si se acerca al límite (80%)
   * 
   * @returns string con mensaje de alerta o empty string si ok
   */
  getStorageWarning(): string {
    const percentage = this.usagePercentage();

    if (percentage >= 95) {
      return '🔴 CRÍTICO: Almacenamiento casi lleno (95%+). No se pueden subir más imágenes.';
    }

    if (percentage >= 80) {
      return '🟡 ALERTA: Almacenamiento al 80%+. Considera expandir plan o eliminar imágenes antiguas.';
    }

    if (percentage >= 50) {
      return '🟠 AVISO: Almacenamiento al 50%+. Se recomienda monitorear el uso.';
    }

    return '';
  }

  /**
   * ✅ Formatea bytes a formato legible
   */
  formatBytes(bytes: number, decimals = 2): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  /**
   * ✅ Resetea los signals (útil para testing)
   */
  reset(): void {
    this.storageStats.set(null);
    this.lastUpdated.set(null);
    this.isLoading.set(false);
  }
}
