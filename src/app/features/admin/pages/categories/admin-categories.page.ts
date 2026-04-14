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

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background p-6">

      <!-- Error de carga global -->
      @if (loadError()) {
        <div class="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
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
            <h1 class="text-2xl font-bold text-text-primary">Gestión de Categorías</h1>
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
          class="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition"
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
                    <span class="font-medium text-text-primary">{{ category.name }}</span>
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
                        <span class="material-icons text-sm text-red-500">close</span>
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
              <h2 class="text-xl font-bold text-text-primary">
                {{ editingId() ? 'Editar Categoría' : 'Nueva Categoría' }}
              </h2>
              <button
                type="button"
                (click)="closeForm()"
                class="text-text-secondary hover:text-text-primary transition">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Formulario -->
            <form [formGroup]="form" (ngSubmit)="saveCategory()" class="p-6 space-y-6">
              
              <!-- Nombre -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Nombre <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  formControlName="name"
                  placeholder="Ej: Bebidas"
                  maxlength="100"
                  class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none transition"
                />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="text-red-500 text-xs mt-1">El nombre es requerido (máx. 100 caracteres)</p>
                }
              </div>

              <!-- Descripción -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Descripción
                </label>
                <textarea
                  formControlName="description"
                  placeholder="Descripción opcional..."
                  maxlength="500"
                  rows="3"
                  class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none transition resize-vertical"
                ></textarea>
                <p class="text-xs text-text-secondary mt-1">{{ form.get('description')?.value?.length || 0 }}/500</p>
              </div>

              <!-- Orden -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Orden de visualización
                </label>
                <input
                  type="number"
                  formControlName="order"
                  min="1"
                  class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary focus:border-primary focus:outline-none transition"
                />
                @if (form.get('order')?.invalid && form.get('order')?.touched) {
                  <p class="text-red-500 text-xs mt-1">El orden debe ser un número positivo</p>
                }
              </div>

              <!-- Error del formulario -->
              @if (formError()) {
                <div class="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {{ formError() }}
                </div>
              }

              <!-- Acciones -->
              <div class="flex gap-3 justify-end pt-4 border-t border-border">
                <button
                  type="button"
                  (click)="closeForm()"
                  class="px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-surface transition font-semibold">
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

  // Formulario reactivo
  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(500)]],
    order: [999, [Validators.required, Validators.min(1)]],
  });

  // Categorías filtradas
  protected filteredCategories = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.categories().filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.description?.toLowerCase().includes(query)
    );
  });

  async ngOnInit(): Promise<void> {
    this.loadError.set(null);
    try {
      await Promise.all([
        this.categoryService.loadCategories(),
        this.subcategoryService.loadSubcategories(),
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.loadError.set(`Error cargando datos: ${msg}`);
    }
  }

  protected hasSubcategories(categoryId: number): boolean {
    return this.subcategories().some((s: any) => s.categoryId === categoryId);
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', description: '', order: this.getNextOrder() });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(category: Category): void {
    this.editingId.set(category.id);
    this.form.reset({
      name: category.name,
      description: category.description || '',
      order: category.order,
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
    this.formError.set(null);
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
        });
      } else {
        await this.categoryService.createCategory({
          name: formValue.name || '',
          description: formValue.description || undefined,
          order: formValue.order || 999,
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
      alert('No puedes eliminar una categoría que tiene subcategorías. Elimina primero las subcategorías.');
      return;
    }

    if (!confirm('¿Estás seguro que deseas eliminar esta categoría?')) return;

    this.isSaving.set(true);

    try {
      await this.categoryService.deleteCategory(id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error al eliminar';
      alert(`Error: ${msg}`);
    } finally {
      this.isSaving.set(false);
    }
  }

  private getNextOrder(): number {
    const maxOrder = Math.max(...this.categories().map(c => c.order), 0);
    return maxOrder + 1;
  }
}
