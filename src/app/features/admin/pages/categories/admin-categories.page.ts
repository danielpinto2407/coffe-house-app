import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Category } from '../../../menu/models/category.model';
import { CategoryService } from '../../../menu/services/category.service';
import { SubcategoryService } from '../../../menu/services/subcategory.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ImageUploadService } from '../../../../core/services/image-upload.service';
import { ImageOptimizationService } from '../../../../core/services/image-optimization.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background p-6">

      <!-- Error de carga global -->
      @if (loadError()) {
        <div class="bg-error/10 border border-error text-error px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <span class="material-icons mt-0.5">error</span>
          <div>
            <p class="font-semibold">Error cargando datos:</p>
            <p class="text-sm">{{ loadError() }}</p>
          </div>
        </div>
      }

      <!-- Cabecera -->
      <div class="flex items-center justify-between mb-8">
        <div class="flex items-center gap-3">
          <a routerLink="/admin"
             class="p-2 rounded-full hover:bg-surface transition">
            <span class="material-icons text-text-secondary">arrow_back</span>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-text">Gestión de Categorías</h1>
            <p class="text-text-secondary text-sm">
              {{ isLoading() ? 'Cargando...' : categories().length + ' categorías en total' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="openCreateForm()"
          [disabled]="isLoading()"
          class="flex items-center justify-center bg-primary text-white w-10 h-10 rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          title="Agregar categoría"
          aria-label="Agregar nueva categoría">
          <span class="material-icons text-lg">add</span>
        </button>
      </div>

      <!-- Buscador -->
      <div class="relative mb-6 max-w-sm">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
        <input
          type="text"
          placeholder="Buscar categoría..."
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          class="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text placeholder-text-secondary focus:outline-none focus:border-primary transition"
        />
      </div>

      <!-- Estado de carga -->
      @if (isLoading()) {
        <div class="flex justify-center items-center min-h-96">
          <div class="text-center">
            <div class="animate-spin mb-4">
              <span class="material-icons text-4xl text-primary">hourglass_empty</span>
            </div>
            <p class="text-text-secondary">Cargando categorías...</p>
          </div>
        </div>
      } @else {
        <!-- Tabla de categorías -->
        <div class="bg-surface rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-background border-b border-border">
              <tr>
                <th class="text-left px-4 py-3 text-text-secondary font-semibold">Categoría</th>
                <th class="text-left px-4 py-3 text-text-secondary font-semibold hidden md:table-cell">Descripción</th>
                <th class="text-center px-4 py-3 text-text-secondary font-semibold hidden lg:table-cell">Orden</th>
                <th class="text-center px-4 py-3 text-text-secondary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (category of filteredCategories(); track category.id) {
                <tr class="border-b border-border last:border-0 hover:bg-background transition cursor-pointer"
                    (click)="openEditForm(category)">
                  <td class="px-4 py-3">
                    <span class="font-medium text-text">{{ category.name }}</span>
                  </td>
                  <td class="px-4 py-3 text-text-secondary hidden md:table-cell max-w-xs truncate text-xs">
                    {{ category.description || '—' }}
                  </td>
                  <td class="px-4 py-3 text-center text-text-secondary hidden lg:table-cell text-xs">
                    <span class="bg-primary/10 text-primary px-2 py-1 rounded">{{ category.order }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        (click)="deleteCategory(category.id); $event.stopPropagation()"
                        [disabled]="isLoading() || hasSubcategories(category.id)"
                        [title]="hasSubcategories(category.id) ? 'No puedes eliminar una categoría que tiene subcategorías' : 'Eliminar'"
                        class="p-2 rounded hover:bg-border transition disabled:opacity-50 disabled:cursor-not-allowed">
                        <span class="material-icons text-sm text-error">close</span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="4" class="px-4 py-8 text-center text-text-secondary">
                    No se encontraron categorías
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal: Formulario de categoría -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-surface rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b border-surface">
              <h2 class="text-xl font-bold text-text">
                {{ editingId() ? 'Editar Categoría' : 'Nueva Categoría' }}
              </h2>
              <button
                type="button"
                (click)="closeForm()"
                class="text-text-secondary hover:text-text transition">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Formulario -->
            <form [formGroup]="form" (ngSubmit)="saveCategory()" class="p-6 space-y-6">
              
              <!-- Nombre -->
              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  Nombre <span class="text-error">*</span>
                </label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="Ej: Bebidas"
                  maxlength="100"
                  class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text placeholder-text-secondary focus:border-primary focus:outline-none transition"
                />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="text-error text-xs mt-1">El nombre es requerido (máx. 100 caracteres)</p>
                }
              </div>

              <!-- Descripción -->
              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  Descripción
                </label>
                <textarea
                  formControlName="description"
                  placeholder="Descripción opcional..."
                  maxlength="500"
                  rows="3"
                  class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text placeholder-text-secondary focus:border-primary focus:outline-none transition resize-vertical"
                ></textarea>
                <p class="text-xs text-text-secondary mt-1">{{ form.get('description')?.value?.length || 0 }}/500</p>
              </div>

              <!-- Orden -->
              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  formControlName="order"
                  min="1"
                  class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text focus:border-primary focus:outline-none transition"
                />
                @if (form.get('order')?.invalid && form.get('order')?.touched) {
                  <p class="text-error text-xs mt-1">El orden debe ser un número positivo</p>
                }
              </div>

              <!-- Imagen de fondo para acordeón -->
              <div>
                <label class="block text-sm font-medium text-text mb-2">
                  Imagen de fondo (Acordeón)
                </label>
                
                <!-- URL Input -->
                <div class="flex gap-2 mb-3">
                  <input formControlName="image" type="url" placeholder="https://..."
                         class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition" />
                </div>

                <!-- Preview actual si existe -->
                <div *ngIf="form.get('image')?.value" class="mb-3 flex items-start gap-3">
                  <img [src]="form.get('image')?.value" alt="Preview de categoría" class="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0" />
                  <div class="flex-1 flex flex-col justify-center gap-1">
                    <p class="text-xs text-text-secondary">Imagen actual</p>
                    <button type="button"
                            (click)="clearImage()"
                            class="text-xs text-error hover:text-error transition self-start">
                      Eliminar
                    </button>
                  </div>
                </div>

                <!-- Zona Drag-Drop (solo en desktop) -->
                <div *ngIf="!isMobile()" (dragover)="onImageDragOver($event)"
                     (dragleave)="onImageDragLeave()"
                     (drop)="onImageDrop($event)"
                     [ngClass]="{'bg-primary/10': isImageDragging(), 'border-primary': isImageDragging()}"
                     class="relative border-2 border-dashed border-border rounded-lg p-6 text-center transition cursor-pointer hover:border-primary hover:bg-primary/5">
                  
                  <input #imageInput type="file" accept="image/*" hidden aria-label="Seleccionar imagen de categoría"
                         (change)="onImageFileSelected($event)" />
                  
                  <div *ngIf="isUploadingImage()" class="space-y-2">
                    <div class="animate-spin inline-block">
                      <span class="material-icons text-2xl text-primary">hourglass_empty</span>
                    </div>
                    <p class="text-sm text-text-secondary">Subiendo: {{ uploadImageProgress() }}%</p>
                  </div>

                  <div *ngIf="!isUploadingImage()" class="space-y-2">
                    <span class="material-icons text-3xl text-text-secondary block">cloud_upload</span>
                    <div>
                      <p class="text-sm font-medium text-text">Arrastra la imagen o haz clic para seleccionar</p>
                      <p class="text-xs text-text-secondary">PNG, JPG o WebP • Máx 5MB</p>
                    </div>
                    <button type="button"
                            (click)="imageInput.click()"
                            class="mt-2 px-3 py-1.5 bg-primary text-white text-sm rounded hover:opacity-90 transition font-medium">
                      Seleccionar archivo
                    </button>
                  </div>
                </div>

                <!-- Simple button upload (solo en móvil) -->
                <div *ngIf="isMobile()" class="space-y-2">
                  <input #imageInput type="file" accept="image/*" hidden aria-label="Seleccionar imagen de categoría"
                         (change)="onImageFileSelected($event)" />
                  
                  <button type="button"
                          (click)="imageInput.click()"
                          [disabled]="isUploadingImage()"
                          class="w-full px-4 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                    <span class="material-icons">{{ isUploadingImage() ? 'hourglass_empty' : 'upload' }}</span>
                    {{ isUploadingImage() ? 'Subiendo...' : 'Seleccionar imagen' }}
                  </button>

                  <p class="text-sm text-text-secondary">
                    {{ isUploadingImage() ? 'Subiendo: ' + uploadImageProgress() + '%' : 'PNG, JPG o WebP • Máx 5MB' }}
                  </p>
                </div>

                <!-- Información de compresión -->
                <div *ngIf="imageEstimatedSize()" class="mt-2 p-2 bg-primary/10 border border-primary/30 rounded text-xs text-primary">
                  <p>📊 Tamaño estimado: {{ imageEstimatedSize() }}KB (máx 500KB)</p>
                </div>

                <!-- Errores de upload -->
                <div *ngIf="imageUploadError()" class="mt-2 p-2 bg-error/10 border border-error/30 rounded text-xs text-error">
                  <p>{{ imageUploadError() }}</p>
                </div>
              </div>

              <!-- Error del formulario -->
              @if (formError()) {
                <div class="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
                  {{ formError() }}
                </div>
              }

              <!-- Acciones -->
              <div class="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeForm()"
                  class="px-4 py-2 rounded-lg border border-border text-text hover:bg-surface transition font-semibold">
                  Cancelar
                </button>
                <button
                  type="submit"
                  [disabled]="form.invalid || isSaving()"
                  class="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="material-icons inline text-lg align-middle mr-1">{{ isSaving() ? 'hourglass_empty' : 'check' }}</span>
                  {{ isSaving() ? (editingId() ? 'Actualizando...' : 'Creando...') : (editingId() ? 'Actualizar' : 'Crear') }}
                </button>
              </div>

            </form>
          </div>
        </div>
      }

    </div>
  `,
})
export class AdminCategoriesPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);
  private readonly imageUploadService = inject(ImageUploadService);
  private readonly imageOptimization = inject(ImageOptimizationService);

  // Signals del estado
  protected readonly isLoading = computed(() => this.categoryService.loading());
  protected readonly categories = computed(() => this.categoryService.categories());
  protected readonly subcategories = computed(() => this.subcategoryService.subcategories());
  
  protected readonly searchQuery = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly formError = signal<string | null>(null);
  
  // Signals para upload de imagen
  protected readonly isUploadingImage = signal(false);
  protected readonly uploadImageProgress = signal(0);
  protected readonly imageUploadError = signal<string | null>(null);
  protected readonly imageEstimatedSize = signal<number | null>(null);
  protected readonly isImageDragging = signal(false);

  // Formulario reactivo
  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    order: [999, [Validators.required, Validators.min(1)]],
    image: [''],
  });

  // Categorías filtradas
  protected filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.categories().filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.description?.toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this.loadError.set(null);
    Promise.all([
      this.categoryService.loadCategories(),
      this.subcategoryService.loadSubcategories(),
    ]).catch((error) => {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.loadError.set(`Error cargando datos: ${msg}`);
    });
  }

  protected hasSubcategories(categoryId: number): boolean {
    return this.subcategories().some((s: any) => s.categoryId === categoryId);
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', order: this.getNextOrder(), image: '' });
    this.imageEstimatedSize.set(null);
    this.imageUploadError.set(null);
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(category: Category): void {
    this.editingId.set(category.id);
    this.form.reset({
      name: category.name,
      description: category.description || '',
      order: category.order,
      image: category.image || '',
    });
    this.imageEstimatedSize.set(null);
    this.imageUploadError.set(null);
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
    this.formError.set(null);
    this.imageEstimatedSize.set(null);
    this.imageUploadError.set(null);
    this.isUploadingImage.set(false);
    this.uploadImageProgress.set(0);
  }

  protected async saveCategory(): Promise<void> {
    if (this.form.invalid) return;

    this.formError.set(null);
    this.isSaving.set(true);

    try {
      const formValue = this.form.getRawValue();
      
      if (this.editingId()) {
        await this.categoryService.updateCategory(this.editingId()!, {
          name: formValue.name || '',
          description: formValue.description || undefined,
          order: formValue.order || 999,
          image: formValue.image || undefined,
        });
      } else {
        await this.categoryService.createCategory({
          name: formValue.name || '',
          description: formValue.description || undefined,
          order: formValue.order || 999,
          image: formValue.image || undefined,
        });
      }

      this.closeForm();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.formError.set(msg);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async deleteCategory(id: number): Promise<void> {
    if (this.hasSubcategories(id)) {
      this.notification.warning('No puedes eliminar una categoría que tiene subcategorías. Elimina primero las subcategorías.');
      return;
    }

    const confirmed = await this.confirmationService.confirm({
      title: 'Eliminar categoría',
      message: '¿Estás seguro que deseas eliminar esta categoría?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    this.isSaving.set(true);

    try {
      await this.categoryService.deleteCategory(id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      this.notification.error(msg);
    } finally {
      this.isSaving.set(false);
    }
  }

  private getNextOrder(): number {
    const maxOrder = Math.max(...this.categories().map(c => c.order), 0);
    return maxOrder + 1;
  }

  protected isMobile(): boolean {
    return window.innerWidth < 768;
  }

  protected onImageDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isImageDragging.set(true);
  }

  protected onImageDragLeave(): void {
    this.isImageDragging.set(false);
  }

  protected onImageDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isImageDragging.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processImageFile(files[0]);
    }
  }

  protected onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processImageFile(input.files[0]);
    }
  }

  protected clearImage(): void {
    this.form.patchValue({ image: '' });
    this.imageEstimatedSize.set(null);
    this.imageUploadError.set(null);
  }

  private async processImageFile(file: File): Promise<void> {
    this.imageUploadError.set(null);

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      this.imageUploadError.set('Por favor selecciona una imagen válida');
      return;
    }

    // Validar tamaño pre-compresión
    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSizeBytes) {
      this.imageUploadError.set('La imagen no puede superar 5 MB');
      return;
    }

    try {
      // Comprimir imagen
      const compressedBlob = await this.imageOptimization.optimizeImage(file);
      const sizeKB = Math.round(compressedBlob.size / 1024);
      this.imageEstimatedSize.set(sizeKB);

      if (sizeKB > 500) {
        this.imageUploadError.set(`Imagen comprimida: ${sizeKB}KB (máx recomendado: 500KB)`);
      }

      // Subir a Supabase
      this.isUploadingImage.set(true);
      this.uploadImageProgress.set(0);

      // ✅ Usar nombre de categoría para generar nombre de archivo consistente
      const categoryName = this.form.get('name')?.value || 'categoria';
      const url = await this.imageUploadService.uploadProductImage(file, categoryName);

      // Llenar el campo imagen automáticamente
      this.form.patchValue({ image: url });
      this.isUploadingImage.set(false);
      this.uploadImageProgress.set(0);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al subir la imagen';
      this.imageUploadError.set(msg);
      this.isUploadingImage.set(false);
      this.uploadImageProgress.set(0);
    }
  }
}
