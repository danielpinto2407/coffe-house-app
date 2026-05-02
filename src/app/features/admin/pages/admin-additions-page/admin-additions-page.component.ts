import { Component, ChangeDetectionStrategy, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AdditionsService } from '../../../../core/services/additions.service';
import { ProductAddition } from '../../../menu/models/product-addition.model';
import { NotificationService } from '../../../../core/services/notification.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';

@Component({
  selector: 'app-admin-additions-page',
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
            <h1 class="text-2xl font-bold text-text-primary">Gestión de Adiciones</h1>
            <p class="text-text-secondary text-sm">
              {{ additions().length }} adiciones en total
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="openCreateForm()"
          class="flex items-center justify-center bg-primary text-white w-10 h-10 rounded-lg hover:opacity-90 transition"
          title="Agregar adición"
          aria-label="Agregar nueva adición">
          <span class="material-icons text-lg">add</span>
        </button>
      </div>

      <!-- Buscador -->
      <div class="relative mb-6 max-w-sm">
        <span class="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary">search</span>
        <input
          type="text"
          placeholder="Buscar adición..."
          [value]="searchQuery()"
          (input)="searchQuery.set($any($event.target).value)"
          class="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-primary transition"
        />
      </div>

      <!-- Tabla -->
      <div class="bg-surface rounded-xl border border-border overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-background border-b border-border">
            <tr>
              <th class="text-left px-4 py-3 text-text-secondary font-semibold">Nombre</th>
              <th class="text-right px-4 py-3 text-text-secondary font-semibold">Precio</th>
              <th class="text-center px-4 py-3 text-text-secondary font-semibold hidden lg:table-cell">Orden</th>
              <th class="text-center px-4 py-3 text-text-secondary font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (addition of filteredAdditions(); track addition.id) {
              <tr class="border-b border-border last:border-0 hover:bg-background transition cursor-pointer"
                  (click)="openEditForm(addition)">
                <td class="px-4 py-3 font-medium text-text-primary">{{ addition.name }}</td>
                <td class="px-4 py-3 text-right font-semibold text-primary">
                  {{ addition.price > 0 ? ('$' + (addition.price | number:'1.0-0')) : 'Incluido' }}
                </td>
                <td class="px-4 py-3 text-center text-text-secondary hidden lg:table-cell text-xs">
                  <span class="bg-primary/10 text-primary px-2 py-1 rounded">{{ addition.order }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center">
                    <button
                      type="button"
                      (click)="deleteAddition(addition.id); $event.stopPropagation()"
                      class="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition"
                      aria-label="Eliminar">
                      <span class="material-icons text-lg">close</span>
                    </button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="4" class="px-4 py-12 text-center text-text-secondary">
                  <span class="material-icons text-4xl mb-2 block">tune</span>
                  No se encontraron adiciones.
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Modal -->
      @if (showForm()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div class="bg-surface rounded-lg shadow-lg max-w-md w-full max-h-screen overflow-y-auto">

            <div class="flex items-center justify-between p-6 border-b border-border">
              <h2 class="text-xl font-bold text-text-primary">
                {{ editingId() ? 'Editar Adición' : 'Nueva Adición' }}
              </h2>
              <button type="button" (click)="closeForm()"
                      class="text-text-secondary hover:text-text-primary transition">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form [formGroup]="form" (ngSubmit)="saveAddition()" class="p-6 space-y-5">

              <!-- Nombre -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Nombre <span class="text-red-500">*</span>
                </label>
                <input type="text" formControlName="name"
                       placeholder="Ej: Leche, Proteína Whey..."
                       class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary placeholder-text-secondary focus:border-primary focus:outline-none transition" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="text-red-500 text-xs mt-1">El nombre es requerido (mín. 2 caracteres)</p>
                }
              </div>

              <!-- Precio -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Precio ($) <span class="text-red-500">*</span>
                </label>
                <input type="number" formControlName="price"
                       placeholder="0" step="500" min="0"
                       class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary focus:border-primary focus:outline-none transition" />
                <p class="text-xs text-text-secondary mt-1">Usa 0 si está incluido sin costo adicional</p>
              </div>

              <!-- Orden -->
              <div>
                <label class="block text-sm font-medium text-text-primary mb-2">
                  Orden de visualización
                </label>
                <input type="number" formControlName="order"
                       min="1" placeholder="999"
                       class="w-full px-4 py-2 rounded-lg border border-border bg-surface text-text-primary focus:border-primary focus:outline-none transition" />
              </div>

              @if (formError()) {
                <div class="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-lg text-sm">
                  {{ formError() }}
                </div>
              }

              <div class="flex gap-3 justify-end pt-4 border-t border-border">
                <button type="button" (click)="closeForm()"
                        class="px-4 py-2 rounded-lg border border-border text-text-primary hover:bg-background transition font-semibold">
                  Cancelar
                </button>
                <button type="submit" [disabled]="form.invalid || isSaving()"
                        class="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
                  <span class="material-icons inline text-lg align-middle mr-1">
                    {{ isSaving() ? 'hourglass_empty' : 'check' }}
                  </span>
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
export class AdminAdditionsPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly additionsService = inject(AdditionsService);
  private readonly notification = inject(NotificationService);
  private readonly confirmationService = inject(ConfirmationService);

  protected readonly additions = signal<ProductAddition[]>([]);
  protected readonly searchQuery = signal('');
  protected readonly showForm = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly isSaving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected readonly filteredAdditions = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.additions().filter(a => a.name.toLowerCase().includes(q));
  });

  protected form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    price: [0, [Validators.required, Validators.min(0)]],
    order: [999, [Validators.min(1)]],
  });

  ngOnInit(): void {
    this.additionsService.getAllAdditions().subscribe(list => this.additions.set(list));
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ name: '', price: 0, order: 999 });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(addition: ProductAddition): void {
    this.editingId.set(addition.id);
    this.form.reset({
      name: addition.name,
      price: addition.price,
      order: addition.order,
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

  protected saveAddition(): void {
    if (this.form.invalid) return;
    this.formError.set(null);
    this.isSaving.set(true);

    const value = this.form.getRawValue() as any;
    const op$ = this.editingId()
      ? this.additionsService.updateAddition(this.editingId()!, value)
      : this.additionsService.createAddition(value);

    op$.subscribe({
      next: () => {
        this.notification.success(this.editingId() ? 'Adición actualizada' : 'Adición creada');
        this.additionsService.getAllAdditions().subscribe(list => this.additions.set(list));
        this.closeForm();
        this.isSaving.set(false);
      },
      error: (err: Error) => {
        this.formError.set(err.message ?? 'Error al guardar');
        this.isSaving.set(false);
      },
    });
  }

  protected async deleteAddition(id: number): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Eliminar adición',
      message: '¿Estás seguro? Se desvinculará de todos los productos que la usen.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger',
    });
    if (!confirmed) return;

    this.additionsService.deleteAddition(id).subscribe({
      next: () => {
        this.notification.success('Adición eliminada');
        this.additions.update(list => list.filter(a => a.id !== id));
      },
      error: () => this.notification.error('Error al eliminar la adición'),
    });
  }
}
