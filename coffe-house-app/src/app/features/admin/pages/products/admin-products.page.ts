import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../../../menu/models/product.model';
import { PRODUCTS } from '../../../menu/data/menu.mock';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background p-6">

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
            <p class="text-text-secondary text-sm">{{ products().length }} productos en total</p>
          </div>
        </div>
        <button
          type="button"
          (click)="openCreateForm()"
          class="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:opacity-90 transition font-semibold">
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

      <!-- Tabla de productos -->
      <div class="bg-surface rounded-xl border border-border overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-background border-b border-border">
            <tr>
              <th class="text-left px-4 py-3 text-text-secondary font-semibold">Producto</th>
              <th class="text-left px-4 py-3 text-text-secondary font-semibold hidden md:table-cell">Descripción</th>
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
                <td class="px-4 py-3 text-text-secondary hidden md:table-cell max-w-xs truncate">
                  {{ product.description || '—' }}
                </td>
                <td class="px-4 py-3 text-right font-semibold text-primary">
                  \${{ product.price.toFixed(2) }}
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
                <td colspan="4" class="px-4 py-12 text-center text-text-secondary">
                  <span class="material-icons text-4xl mb-2 block">search_off</span>
                  No se encontraron productos.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal de creación / edición -->
      @if (showForm()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4"
             (click)="closeForm()">
          <div class="absolute inset-0 bg-black/50"></div>
          <div class="relative bg-surface rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10"
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

              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Nombre *</label>
                <input formControlName="name" type="text" placeholder="Ej: Café Latte"
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="text-red-500 text-xs mt-1">El nombre es obligatorio.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Precio *</label>
                <input formControlName="price" type="number" step="0.01" placeholder="0.00"
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition" />
                @if (form.get('price')?.invalid && form.get('price')?.touched) {
                  <p class="text-red-500 text-xs mt-1">Ingresa un precio válido mayor a 0.</p>
                }
              </div>

              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
                <textarea formControlName="description" rows="3" placeholder="Descripción del producto..."
                          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition resize-none"></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">URL de imagen</label>
                <input formControlName="image" type="url" placeholder="https://..."
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:border-primary transition" />
              </div>

              @if (formError()) {
                <p class="text-red-500 text-sm bg-red-500/10 px-3 py-2 rounded-lg">{{ formError() }}</p>
              }

              <div class="flex gap-3 pt-2">
                <button type="button" (click)="closeForm()"
                        class="flex-1 py-2 rounded-lg border border-border text-text-secondary hover:bg-background transition font-medium">
                  Cancelar
                </button>
                <button type="submit"
                        [disabled]="form.invalid || isSaving()"
                        class="flex-1 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  {{ isSaving() ? 'Guardando...' : (editingId() === null ? 'Crear producto' : 'Guardar cambios') }}
                </button>
              </div>

            </form>
          </div>
        </div>
      }

    </div>
  `,
})
export class AdminProductsPage {
  private readonly fb = inject(FormBuilder);

  // Estado
  protected readonly products = signal<Product[]>([...PRODUCTS]);
  protected readonly searchQuery = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly formError = signal<string | null>(null);

  // Productos filtrados
  protected readonly filteredProducts = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    if (!q) return this.products();
    return this.products().filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  });

  // Formulario
  protected readonly form = this.fb.group({
    name:        ['', [Validators.required, Validators.minLength(2)]],
    price:       [0,  [Validators.required, Validators.min(0.01)]],
    description: [''],
    image:       [''],
  });

  openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', price: 0, description: '', image: '' });
    this.formError.set(null);
    this.showForm.set(true);
  }

  openEditForm(product: Product): void {
    this.editingId.set(product.id);
    this.form.reset({
      name:        product.name,
      price:       product.price,
      description: product.description ?? '',
      image:       product.image ?? '',
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.editingId.set(null);
  }

  saveProduct(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.formError.set(null);

    const value = this.form.getRawValue();

    if (this.editingId() === null) {
      const newId = Math.max(0, ...this.products().map(p => p.id)) + 1;
      this.products.update(list => [
        ...list,
        {
          id:            newId,
          subcategoryId: 1,
          order:         newId,
          name:          value.name ?? '',
          price:         value.price ?? 0,
          description:   value.description ?? '',
          image:         value.image ?? '',
        },
      ]);
    } else {
      this.products.update(list =>
        list.map(p =>
          p.id === this.editingId()
            ? {
                ...p,
                name:        value.name ?? p.name,
                price:       value.price ?? p.price,
                description: value.description ?? '',
                image:       value.image ?? '',
              }
            : p
        )
      );
    }

    this.isSaving.set(false);
    this.closeForm();
  }

  deleteProduct(id: number): void {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    this.products.update(list => list.filter(p => p.id !== id));
  }
}
