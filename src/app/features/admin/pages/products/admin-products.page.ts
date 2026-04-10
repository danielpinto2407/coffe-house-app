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
import { Product } from '../../../menu/models/product.model';
import { ProductService } from '../../../menu/services/product.service';
import { CategoryService } from '../../../menu/services/category.service';
import { SubcategoryService } from '../../../menu/services/subcategory.service';
import { Category } from '../../../menu/models/category.model';
import { Subcategory } from '../../../menu/models/subcategory.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background p-6">

      <!-- ✅ Error de carga global -->
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
             class="p-2 rounded-full hover:bg-surface transition"
             aria-label="Volver al dashboard">
            <span class="material-icons text-text-secondary">arrow_back</span>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-text-primary">Gestión de Productos</h1>
            <p class="text-text-secondary text-sm">
              {{ isLoading() ? 'Cargando...' : products().length + ' productos en total' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="openCreateForm()"
          [disabled]="isLoading()"
          class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
          <span class="material-icons text-lg">add</span>
          Nuevo producto
        </button>
      </div>

      <!-- Buscador -->
      <div class="relative mb-6 max-w-sm">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
        <input
          type="text"
          placeholder="Buscar producto..."
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
            <p class="text-text-secondary">Cargando productos...</p>
          </div>
        </div>
      } @else {
        <!-- Tabla de productos -->
        <div class="bg-surface rounded-xl border border-border overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-background border-b border-border">
              <tr>
                <th class="text-left px-4 py-3 text-text-secondary font-semibold">Producto</th>
                <th class="text-left px-4 py-3 text-text-secondary font-semibold hidden md:table-cell">Subcategoría</th>
                <th class="text-left px-4 py-3 text-text-secondary font-semibold hidden lg:table-cell">Descripción</th>
                <th class="text-right px-4 py-3 text-text-secondary font-semibold">Precio</th>
                <th class="text-center px-4 py-3 text-text-secondary font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (product of filteredProducts(); track product.id) {
                <tr class="border-b border-border last:border-0 hover:bg-background transition">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      @if (product.image) {
                        <img [src]="product.image" [alt]="product.name"
                             class="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                      } @else {
                        <div class="w-10 h-10 rounded-lg bg-border flex items-center justify-center flex-shrink-0">
                          <span class="material-icons text-text-secondary text-lg">image_not_supported</span>
                        </div>
                      }
                      <span class="font-medium text-text-primary">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-text-secondary hidden md:table-cell text-xs">
                    <span class="bg-primary/10 text-primary px-2 py-1 rounded">{{ getSubcategoryName(product.subcategoryId) }}</span>
                  </td>
                  <td class="px-4 py-3 text-text-secondary hidden lg:table-cell max-w-xs truncate text-xs">
                    {{ product.description || '—' }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-primary">
                    {{ product.price.toFixed(2) | currency }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        (click)="openEditForm(product)"
                        class="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition"
                        aria-label="Editar">
                        <span class="material-icons text-lg">edit</span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteProduct(product.id)"
                        class="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                        aria-label="Eliminar">
                        <span class="material-icons text-lg">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="5" class="px-4 py-12 text-center text-text-secondary">
                    <span class="material-icons text-4xl mb-2 block">search_off</span>
                    No se encontraron productos.
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modal de creación / edición -->
      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
             (click)="closeForm()">
          <div class="absolute inset-0 bg-black/50"></div>
          <div class="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto"
               (click)="$event.stopPropagation()">

            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-bold text-text-primary">
                {{ editingId() === null ? 'Nuevo producto' : 'Editar producto' }}
              </h2>
              <button type="button" (click)="closeForm()"
                      class="p-2 rounded-full hover:bg-background transition">
                <span class="material-icons text-text-secondary">close</span>
              </button>
            </div>

            <form [formGroup]="form" (ngSubmit)="saveProduct()" class="space-y-4">

              <!-- Nombre -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Nombre *</label>
                <input formControlName="name" type="text" placeholder="Ej: Café Latte"
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="text-red-500 text-xs mt-1">
                    {{ form.get('name')?.getError('required') ? 'El nombre es obligatorio.' : 'Mínimo 2 caracteres.' }}
                  </p>
                }
              </div>

              <!-- Precio -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Precio *</label>
                <input formControlName="price" type="number" step="0.01" placeholder="0.00"
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition" />
                @if (form.get('price')?.invalid && form.get('price')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Ingresa un precio válido mayor a 0.</p>
                }
              </div>

              <!-- Subcategoría -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Subcategoría *</label>
                <select formControlName="subcategoryId"
                        class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition">
                  @for (subcat of subcategories(); track subcat.id) {
                    <option [value]="subcat.id">{{ subcat.name }}</option>
                  }
                </select>
              </div>

              <!-- Orden -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Orden de visualización</label>
                <input formControlName="order" type="number" placeholder="0"
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition" />
                <p class="text-text-secondary text-xs mt-1">Números menores aparecen primero.</p>
              </div>

              <!-- Descripción -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
                <textarea formControlName="description" rows="3" placeholder="Descripción del producto..."
                          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition resize-none"></textarea>
              </div>

              <!-- Imagen -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">URL de imagen</label>
                <input formControlName="image" type="url" placeholder="https://..."
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition" />
                @if (form.get('image')?.value) {
                  <img [src]="form.get('image')?.value" alt="Preview" class="w-12 h-12 rounded-lg object-cover mt-2" />
                }
              </div>

              <!-- Error del formulario -->
              @if (formError()) {
                <p class="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{{ formError() }}</p>
              }

              <!-- Botones -->
              <div class="flex gap-3 pt-4">
                <button type="button" (click)="closeForm()"
                        class="flex-1 py-2 rounded-lg border border-border text-text-secondary hover:bg-background transition font-medium">
                  Cancelar
                </button>
                <button type="submit"
                        [disabled]="form.invalid || isSaving()"
                        class="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ isSaving() ? 'Guardando...' : (editingId() === null ? 'Crear' : 'Guardar') }}
                </button>
              </div>

            </form>
          </div>
        </div>
      }

    </div>
  `,
})
export class AdminProductsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly subcategoryService = inject(SubcategoryService);

  // ✅ SIGNALS: Estado reactivo desde servicios
  protected readonly isLoading = computed(() => this.productService.loading());
  protected readonly products = computed(() => this.productService.products());
  protected readonly categories = computed(() => this.categoryService.categories());
  protected readonly subcategories = computed(() => this.subcategoryService.subcategories());

  protected readonly searchQuery = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly formError = signal<string | null>(null);
  protected readonly loadError = signal<string | null>(null);

  // ✅ Productos filtrados
  protected readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  });

  // ✅ Formulario con validaciones
  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    subcategoryId: [1, [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
    image: ['', [Validators.pattern(/^https?:\/\/.+/)]],
    order: [0, [Validators.required]],
  });

  async ngOnInit(): Promise<void> {
    this.loadError.set(null);
    try {
      await Promise.all([
        this.productService.loadProducts(),
        this.categoryService.loadCategories(),
        this.subcategoryService.loadSubcategories(),
      ]);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.loadError.set(`Error cargando datos: ${msg}`);
    }
  }

  protected getSubcategoryName(subcategoryId: number): string {
    return this.subcategories().find(s => s.id === subcategoryId)?.name ?? 'Sin categoría';
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', price: 0, subcategoryId: 1, description: '', image: '', order: this.getNextOrder() });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(product: Product): void {
    this.editingId.set(product.id);
    this.form.reset({
      name: product.name,
      price: product.price,
      subcategoryId: product.subcategoryId,
      description: product.description ?? '',
      image: product.image ?? '',
      order: product.order,
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
    this.form.reset();
  }

  protected async saveProduct(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    try {
      const value = this.form.getRawValue();
      const product: Omit<Product, 'id'> = {
        name: value.name ?? '',
        price: value.price ?? 0,
        subcategoryId: value.subcategoryId ?? 1,
        description: value.description ?? '',
        image: value.image ?? '',
        order: value.order ?? 0,
      };

      if (this.editingId() === null) {
        await this.productService.createProduct(product);
      } else {
        await this.productService.updateProduct(this.editingId()!, product);
      }

      this.closeForm();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.formError.set(msg);
    } finally {
      this.isSaving.set(false);
    }
  }

  protected async deleteProduct(id: number): Promise<void> {
    if (!confirm('¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await this.productService.deleteProduct(id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al eliminar: ${msg}`);
    }
  }

  private getNextOrder(): number {
    const maxOrder = Math.max(0, ...this.products().map(p => p.order));
    return maxOrder + 1;
  }
}
