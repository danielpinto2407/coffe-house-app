import {
  Component, inject, signal, output,
  ChangeDetectionStrategy, viewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageUploadService } from '../../core/services/image-upload.service';
import { ImageOptimizationService } from '../../core/services/image-optimization.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-image-upload-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload-modal.component.html',
  styleUrl: './image-upload-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadModalComponent {

  // Services
  private readonly imageUpload    = inject(ImageUploadService);
  private readonly imageOpt       = inject(ImageOptimizationService);
  private readonly notification   = inject(NotificationService);

  // View
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  // State
  protected readonly isDragging    = signal(false);
  protected readonly isUploading   = signal(false);
  protected readonly preview       = signal<string | null>(null);
  protected readonly originalSize  = signal<number | null>(null);
  protected readonly estimatedSize = signal<string | null>(null);
  private readonly selectedFile    = signal<File | null>(null);

  // Outputs
  readonly imageUploaded = output<string>();
  readonly closeModal    = output<void>();

  // ── Drag & Drop ──────────────────────────────────────────
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
    files?.length === 1
      ? this.processFile(files[0])
      : this.notification.error('Por favor, arrastra solo 1 imagen');
  }

  // ── File handling ─────────────────────────────────────────
  onFileSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (files?.length === 1) this.processFile(files[0]);
  }

  triggerInput(): void {
    this.fileInput().nativeElement.click();
  }

  private async processFile(file: File): Promise<void> {
    const ALLOWED = ['image/webp', 'image/jpeg', 'image/png', 'image/jpg'];
    const MAX_MB  = 5;

    try {
      if (!ALLOWED.includes(file.type))
        throw new Error('Tipo no permitido. Solo: WebP, JPEG, PNG');

      if (file.size > MAX_MB * 1024 * 1024)
        throw new Error(`Archivo muy grande (${(file.size / 1024 / 1024).toFixed(2)}MB). Máximo: ${MAX_MB}MB`);

      this.selectedFile.set(file);
      this.originalSize.set(file.size);
      this.preview.set(await this.readAsDataURL(file));
      this.estimatedSize.set(await this.getEstimatedSize(file));

    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : 'Error desconocido');
      this.clear();
    }
  }

  private readAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  }

  private async getEstimatedSize(file: File): Promise<string> {
    try {
      const compressed = await this.imageOpt.optimizeImage(file);
      const savings    = this.imageOpt.calculateSavings(file.size, compressed.size);
      return `${(compressed.size / 1024).toFixed(0)}KB (${savings} ahorrado)`;
    } catch {
      return 'Error en estimación';
    }
  }

  // ── Actions ───────────────────────────────────────────────
  async uploadImage(): Promise<void> {
    const file = this.selectedFile();
    if (!file) return this.notification.error('No hay imagen seleccionada');

    this.isUploading.set(true);
    try {
      const url = await this.imageUpload.uploadProductImage(file);
      this.notification.success('Imagen subida exitosamente');
      this.imageUploaded.emit(url);
      this.close();
    } catch (error) {
      this.notification.error(error instanceof Error ? error.message : 'Error en carga');
    } finally {
      this.isUploading.set(false);
    }
  }

  clear(): void {
    this.selectedFile.set(null);
    this.preview.set(null);
    this.originalSize.set(null);
    this.estimatedSize.set(null);
  }

  close(): void {
    this.clear();
    this.closeModal.emit();
  }
}