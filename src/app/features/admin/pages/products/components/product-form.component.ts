import { Component, inject, signal, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Product } from '../../../menu/models/product.model';
import { Category } from '../../../menu/models/category.model';
import { Subcategory } from '../../../menu/models/subcategory.model';
import { CategoryService } from '../../../menu/services/category.service';
import { SubcategoryService } from '../../../menu/services/subcategory.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div class="bg-surface rounded-lg shadow-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-surface">
          <h2 class="text-xl font-bold text-text">
            {{ product() ? 'Editar Producto' : 'Nuevo Producto' }}
          </h2>
          <button
            type="button"
            (click)="onCancel()"
            class="text-text-secondary hover:text-text transition"
            aria-label="Cerrar">
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Formulario -->
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-6">
          
          <!-- Categoría -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Categoría <span class="text-red-500">*</span>
            </label>
            <select
              formControlName="categoryId"
              (change)="onCategoryChange()"
              class="w-full px-4 py-2 rounded-lg border border-surface bg-background text-text
                     focus:border-primary focus:outline-none transition">
              <option value="">Selecciona categoría...</option>
              <option *ngFor="let cat of categories()" [value]="cat.id">
                {{ cat.name }}
              </option>
            </select>
            <span *ngIf="isFieldInvalid('categoryId')" class="text-red-500 text-xs mt-1">
              Categoría es requerida
            </span>
          </div>

          <!-- Subcategoría (Opcional) -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Subcategoría <span class="text-text-secondary text-xs">(Opcional)</span>
            </label>
            <select
              formControlName="subcategoryId"
              class="w-full px-4 py-2 rounded-lg border border-surface bg-background text-text
                     focus:border-primary focus:outline-none transition">
              <option value="">Sin subcategoría (producto directo de categoría)</option>
              <option *ngFor="let sub of filteredSubcategories()" [value]="sub.id">
                {{ sub.name }}
              </option>
            </select>
            <p class="text-xs text-text-secondary mt-2">
              Si no seleccionas subcategoría, el producto aparecerá directamente en la categoría.
            </p>
          </div>

          <!-- Nombre -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Nombre del Producto <span class="text-red-500">*</span>
            </label>
            <input
              type="text"
              formControlName="name"
              placeholder="Ej: Cappuccino"
              maxlength="100"
              class="w-full px-4 py-2 rounded-lg border border-surface bg-background text-text placeholder-text-secondary
                     focus:border-primary focus:outline-none transition" />
            <span *ngIf="isFieldInvalid('name')" class="text-red-500 text-xs mt-1">
              Nombre es requerido (máx. 100 caracteres)
            </span>
          </div>

          <!-- Precio -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Precio <span class="text-red-500">*</span>
            </label>
            <input
              type="number"
              formControlName="price"
              placeholder="Ej: 6500"
              min="0"
              step="100"
              class="w-full px-4 py-2 rounded-lg border border-surface bg-background text-text
                     focus:border-primary focus:outline-none transition" />
            <span *ngIf="isFieldInvalid('price')" class="text-red-500 text-xs mt-1">
              Precio es requerido y debe ser positivo
            </span>
          </div>

          <!-- Descripción -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Descripción
            </label>
            <textarea
              formControlName="description"
              placeholder="Descripción del producto..."
              maxlength="500"
              rows="3"
              class="w-full px-4 py-2 rounded-lg border border-surface bg-background text-text placeholder-text-secondary
                     focus:border-primary focus:outline-none transition resize-none" />
            <div class="text-xs text-text-secondary mt-1">
              {{ descriptionLength() }}/500 caracteres
            </div>
          </div>

          <!-- Imagen -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              URL de Imagen
            </label>
            <input
              type="url"
              formControlName="image"
              placeholder="https://..."
              class="w-full px-4 py-2 rounded-lg border border-surface bg-background text-text placeholder-text-secondary
                     focus:border-primary focus:outline-none transition" />
            <span *ngIf="isFieldInvalid('image')" class="text-red-500 text-xs mt-1">
              URL de imagen inválida
            </span>
            <!-- Preview -->
            <div *ngIf="form.get('image')?.value" class="mt-3">
              <img 
                [src]="form.get('image')?.value" 
                alt="Preview"
                onerror="this.style.display='none'"
                class="w-24 h-24 object-cover rounded-lg border border-surface" />
            </div>
          </div>

          <!-- Orden -->
          <div>
            <label class="block text-sm font-medium text-text mb-2">
              Orden de Presentación
            </label>
            <input
              type="number"
              formControlName="order"
              min="1"
              class="w-full px-4 py-2 rounded-lg border border-surface bg-background text-text
                     focus:border-primary focus:outline-none transition" />
          </div>

          <!-- Errores globales -->
          <div *ngIf="errorMessage()" class="p-3 rounded-lg bg-red-500/10 border border-red-500 text-red-500 text-sm">
            {{ errorMessage() }}
          </div>

          <!-- Botones -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-surface">
            <button
              type="button"
              (click)="onCancel()"
              class="px-6 py-2 rounded-lg border border-surface text-text hover:bg-surface transition font-medium">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="form.invalid || isLoading()"
              class="px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition font-medium flex items-center gap-2">
              <span class="material-icons" *ngIf="isLoading()">hourglass_empty</span>
              {{ isLoading() ? (product() ? 'Actualizando...' : 'Creando...') : (product() ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ProductFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);

  readonly product = input<Product | null>(null);
  readonly submitted = output<Product>();
  readonly cancelled = output<void>();

  protected readonly categories = signal<Category[]>([]);
  protected readonly allSubcategories = signal<Subcategory[]>([]);
  protected readonly filteredSubcategories = signal<Subcategory[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly errorMessage = signal<string | null>(null);

  protected form = this.fb.group({
    categoryId: ['', Validators.required],
    subcategoryId: [''], // ✅ Opcional
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    price: [0, [Validators.required, Validators.min(0)]],
    description: ['', [Validators.maxLength(500)]],
    image: ['', [Validators.pattern(/^https?:\/\/.+|^$/)]],
    order: [999, [Validators.required, Validators.min(1)]]
  });

  constructor() {
    this.loadCategories();
    this.loadSubcategories();
    
    // Si hay producto, prellenar el formulario
    if (this.product()) {
      setTimeout(() => {
        const prod = this.product();
        if (prod) {
          this.form.patchValue({
            categoryId: prod.categoryId || '',
            subcategoryId: prod.subcategoryId || '',
            name: prod.name,
            price: prod.price,
            description: prod.description || '',
            image: prod.image || '',
            order: prod.order
          });
          // Filtrar subcategorías según la categoría del producto
          if (prod.categoryId) {
            this.filterSubcategoriesByCategory(prod.categoryId);
          }
        }
      }, 0);
    }
  }

  private async loadCategories(): Promise<void> {
    try {
      await this.categoryService.loadCategories();
      this.categories.set(this.categoryService.categories());
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  }

  private async loadSubcategories(): Promise<void> {
    try {
      await this.subcategoryService.loadSubcategories();
      this.allSubcategories.set(this.subcategoryService.subcategories());
    } catch (err) {
      console.error('Error loading subcategories:', err);
    }
  }

  protected onCategoryChange(): void {
    const categoryId = this.form.get('categoryId')?.value;
    if (categoryId) {
      this.filterSubcategoriesByCategory(Number(categoryId));
    }
    // Limpiar subcategoría al cambiar categoría
    this.form.get('subcategoryId')?.setValue('');
  }

  private filterSubcategoriesByCategory(categoryId: number): void {
    const filtered = this.allSubcategories().filter(sub => sub.categoryId === categoryId);
    this.filteredSubcategories.set(filtered);
  }

  protected isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  protected descriptionLength = signal(0);

  onDescriptionChange(): void {
    const desc = this.form.get('description')?.value || '';
    this.descriptionLength.set(desc.length);
  }

  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    try {
      const formData = this.form.value;
      const product: Product = {
        id: this.product()?.id || 0,
        categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        subcategoryId: formData.subcategoryId ? Number(formData.subcategoryId) : undefined,
        name: formData.name as string,
        price: formData.price as number,
        description: formData.description || undefined,
        image: formData.image || undefined,
        order: formData.order as number
      };

      this.submitted.emit(product);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      this.errorMessage.set(errorMsg);
    } finally {
      this.isLoading.set(false);
    }
  }

  protected onCancel(): void {
    this.cancelled.emit();
  }
}
