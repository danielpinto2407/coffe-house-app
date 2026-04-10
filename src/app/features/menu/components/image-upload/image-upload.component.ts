import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ImageUploadService } from '../../../../core/services/image-upload.service';
import { ImageOptimizationService } from '../../../../core/services/image-optimization.service';
import { ProductService } from '../../services/product.service';
import { NotificationService } from '../../../../core/services/notification.service';

interface FilePreview {
  file: File;
  preview: string;
  compressedSize?: number;
  originalSize: number;
  savings?: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './image-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent {
  private readonly imageUpload = inject(ImageUploadService);
  private readonly imageOpt = inject(ImageOptimizationService);
  private readonly productService = inject(ProductService);
  private readonly notification = inject(NotificationService);

  // Signals
  protected readonly filePreviews = signal<FilePreview[]>([]);
  protected readonly isDragging = signal(false);
  protected readonly isUploading = signal(false);
  protected readonly uploadProgress = computed(() => this.imageUpload.uploading());
  protected readonly products = computed(() => this.productService.products());
  
  protected readonly productsWithoutImage = computed(() =>
    this.products().filter(p => !p.image || p.image.trim() === '')
  );

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(true);
  }

  onDragLeave(): void {
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    
    const files = event.dataTransfer?.files;
    if (files) {
      this.processFiles(Array.from(files));
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }

  private async processFiles(files: File[]): Promise<void> {
    for (const file of files) {
      try {
        // Crear preview
        const reader = new FileReader();
        reader.onload = async (e) => {
          const preview: FilePreview = {
            file,
            preview: (e.target?.result as string) || '',
            originalSize: file.size,
          };

          // Comprimir para mostrar tamaño
          try {
            const compressed = await this.imageOpt.optimizeImage(file);
            preview.compressedSize = compressed.size;
            preview.savings = this.imageOpt.calculateSavings(file.size, compressed.size);
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error en compresión';
            console.error('Error estimando compresión:', err);
            preview.savings = 'Error estimando';
          }

          this.filePreviews.update(prev => [...prev, preview]);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Error desconocido';
        this.notification.error(msg);
      }
    }
  }

  removeFile(fileName: string): void {
    this.filePreviews.update(prev =>
      prev.filter(p => p.file.name !== fileName)
    );
  }

  clearAll(): void {
    this.filePreviews.set([]);
  }

  async uploadAll(): Promise<void> {
    const files = this.filePreviews().map(p => p.file);
    if (files.length === 0) return;

    this.isUploading.set(true);

    try {
      const urls = await this.imageUpload.uploadMultipleImages(files);
      this.notification.success(`✅ ${urls.length} imagen(es) subida(s) exitosamente`);
      this.filePreviews.set([]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.notification.error(`Error: ${msg}`);
    } finally {
      this.isUploading.set(false);
    }
  }
}
