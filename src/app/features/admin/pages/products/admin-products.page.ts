import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
  viewChild,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Product } from '../../../menu/models/product.model';
import { ProductService } from '../../../menu/services/product.service';
import { CategoryService } from '../../../menu/services/category.service';
import { SubcategoryService } from '../../../menu/services/subcategory.service';
import { ImageUploadService } from '../../../../core/services/image-upload.service';
import { ImageOptimizationService } from '../../../../core/services/image-optimization.service';
import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { StorageIndicatorComponent } from '../../components/storage-indicator/storage-indicator.component';
import { AdditionsService } from '../../../../core/services/additions.service';
import { ProductAddition } from '../../../menu/models/product-addition.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, StorageIndicatorComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background p-6">

      <!-- Dashboard de almacenamiento -->
      <div class="mb-8">
        <app-storage-indicator></app-storage-indicator>
      </div>

      <!-- ✅ Error de carga global -->
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
             class="p-2 rounded-full hover:bg-surface transition"
             aria-label="Volver al dashboard">
            <span class="material-icons text-text-secondary">arrow_back</span>
          </a>
          <div>
            <h1 class="text-2xl font-bold text-text">Gestión de Productos</h1>
            <p class="text-text-secondary text-sm">
              {{ isLoading() ? 'Cargando...' : products().length + ' productos en total' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          (click)="openCreateForm()"
          [disabled]="isLoading()"
          class="flex items-center justify-center bg-primary text-white w-10 h-10 rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          title="Agregar producto"
          aria-label="Agregar nuevo producto">
          <span class="material-icons text-lg">add</span>
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
                <tr class="border-b border-border last:border-0 hover:bg-background transition cursor-pointer"
                    (click)="openEditForm(product)">
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
                      <span class="font-medium text-text">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-text-secondary hidden md:table-cell text-xs">
                    <span class="bg-primary/10 text-primary px-2 py-1 rounded">{{ getSubcategoryName(product.subcategoryId) }}</span>
                  </td>
                  <td class="px-4 py-3 text-text-secondary hidden lg:table-cell max-w-xs truncate text-xs">
                    {{ product.description || '—' }}
                  </td>
                  <td class="px-4 py-3 text-right font-semibold text-primary">
                    {{ product.price | number:'1.0-0' }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        (click)="openAdditionsModal(product); $event.stopPropagation()"
                        class="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition"
                        title="Gestionar adiciones"
                        aria-label="Gestionar adiciones">
                        <span class="material-icons text-lg">tune</span>
                      </button>
                      <button
                        type="button"
                        (click)="deleteProduct(product.id); $event.stopPropagation()"
                        class="p-1.5 rounded-lg hover:bg-error/10 text-error transition"
                        aria-label="Eliminar">
                        <span class="material-icons text-lg">close</span>
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
              <h2 class="text-xl font-bold text-text">
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
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition" />
                @if (form.get('name')?.invalid && form.get('name')?.touched) {
                  <p class="text-error text-xs mt-1">
                    {{ form.get('name')?.getError('required') ? 'El nombre es obligatorio.' : 'Mínimo 2 caracteres.' }}
                  </p>
                }
              </div>

              <!-- Precio -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Precio *</label>
                <input formControlName="price" type="number" step="0.01" placeholder="0.00"
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition" />
                @if (form.get('price')?.invalid && form.get('price')?.touched) {
                  <p class="text-error text-xs mt-1">Ingresa un precio válido mayor a 0.</p>
                }
              </div>

              <!-- Categoría -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Categoría *</label>
                <select formControlName="categoryId"
                        class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition">
                  <option value="">Selecciona categoría...</option>
                  @for (cat of categories(); track cat.id) {
                    <option [value]="stringifyId(cat.id)">{{ cat.name }}</option>
                  }
                </select>
                @if (form.get('categoryId')?.invalid && form.get('categoryId')?.touched) {
                  <p class="text-error text-xs mt-1">Categoría es requerida</p>
                }
              </div>

              <!-- Subcategoría (Opcional) -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Subcategoría <span class="text-text-secondary text-xs">(Opcional)</span></label>
                <select formControlName="subcategoryId"
                        class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition">
                  <option value="">Sin subcategoría (producto directo)</option>
                  @for (subcat of subcategories(); track subcat.id) {
                    <option [value]="stringifyId(subcat.id)">{{ subcat.name }}</option>
                  }
                </select>
                <p class="text-text-secondary text-xs mt-1">Si no seleccionas, el producto aparecerá directamente en la categoría.</p>
              </div>

              <!-- Orden -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Orden de visualización</label>
                <input formControlName="order" type="number" placeholder="0"
                       class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition" />
                <p class="text-text-secondary text-xs mt-1">Números menores aparecen primero.</p>
              </div>

              <!-- Descripción -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Descripción</label>
                <textarea formControlName="description" rows="3" placeholder="Descripción del producto..."
                          class="w-full px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition resize-none"></textarea>
              </div>

              <!-- Imagen con Drag-Drop Inline -->
              <div>
                <label class="block text-sm font-medium text-text-secondary mb-1">Imagen del Producto</label>
                
                <!-- URL Input -->
                <div class="flex gap-2 mb-3">
                  <input formControlName="image" type="url" placeholder="https://..."
                         class="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-text focus:outline-none focus:border-primary transition" />
                </div>

                <!-- Preview actual si existe -->
                <div *ngIf="form.get('image')?.value" class="mb-3 flex items-start gap-3">
                  <img [src]="form.get('image')?.value" alt="Preview" class="w-16 h-16 rounded-lg object-cover border border-border flex-shrink-0" />
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
                  
                  <input #imageInput type="file" accept="image/*" hidden
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
                  <input #imageInput type="file" accept="image/*" hidden
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
                <div *ngIf="imageEstimatedSize()" class="mt-2 p-2 bg-blue-500/10 border border-blue-500/30 rounded text-xs text-blue-600">
                  <p>📊 Tamaño estimado: {{ imageEstimatedSize() }}KB (máx 500KB)</p>
                </div>

                <!-- Errores de upload -->
                <div *ngIf="imageUploadError()" class="mt-2 p-2 bg-error/10 border border-error/30 rounded text-xs text-error">
                  <p>{{ imageUploadError() }}</p>
                </div>
              </div>

              <!-- Error del formulario -->
              @if (formError()) {
                <p class="text-error text-sm bg-error/10 px-3 py-2 rounded-lg">{{ formError() }}</p>
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

      <!-- Modal gestión de adiciones por producto -->
      @if (additionsModalProduct()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
             (click)="closeAdditionsModal()">
          <div class="bg-surface rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col"
               (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 class="text-lg font-bold text-text">Adiciones</h2>
                <p class="text-xs text-text-secondary mt-0.5">{{ additionsModalProduct()!.name }}</p>
              </div>
              <button type="button" (click)="closeAdditionsModal()"
                      class="p-1.5 rounded-lg hover:bg-background transition text-text-secondary">
                <span class="material-icons">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="flex-1 overflow-y-auto p-5">
              @if (loadingAdditions()) {
                <div class="flex items-center justify-center py-8">
                  <span class="material-icons animate-spin text-primary">refresh</span>
                </div>
              } @else if (allAdditions().length === 0) {
                <p class="text-center text-text-secondary py-8 text-sm">
                  No hay adiciones creadas aún.<br>
                  <a routerLink="/admin/additions" class="text-primary underline">Crear adiciones</a>
                </p>
              } @else {
                <p class="text-xs text-text-secondary mb-4">
                  Marca las adiciones disponibles para este producto:
                </p>
                <div class="space-y-2">
                  @for (addition of allAdditions(); track addition.id) {
                    <label class="flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition
                                  hover:border-primary"
                           [class.border-primary]="productAdditionIds().has(addition.id!)"
                           [class.bg-primary]="productAdditionIds().has(addition.id!)"
                           [class.bg-opacity-5]="productAdditionIds().has(addition.id!)"
                           [class.border-border]="!productAdditionIds().has(addition.id!)">
                      <input type="checkbox"
                             [checked]="productAdditionIds().has(addition.id!)"
                             (change)="toggleAddition(addition)"
                             class="w-4 h-4 cursor-pointer accent-primary" />
                      <div class="flex-1 min-w-0">
                        <span class="font-semibold text-sm text-text">{{ addition.name }}</span>
                      </div>
                      <span class="text-sm font-semibold text-primary flex-shrink-0">
                        {{ addition.price > 0 ? '+$' + addition.price : 'Incluido' }}
                      </span>
                    </label>
                  }
                </div>
              }
            </div>

            <!-- Footer -->
            <div class="p-5 border-t border-border">
              <p class="text-xs text-text-secondary text-center">
                Los cambios se guardan automáticamente al marcar/desmarcar
              </p>
            </div>
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
  private readonly imageUploadService = inject(ImageUploadService);
  private readonly imageOptimization = inject(ImageOptimizationService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly notification = inject(NotificationService);
  private readonly additionsService = inject(AdditionsService);

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

  // 🔗 Adiciones por producto
  protected readonly additionsModalProduct = signal<Product | null>(null);
  protected readonly allAdditions = signal<ProductAddition[]>([]);
  protected readonly productAdditionIds = signal<Set<number>>(new Set());
  protected readonly loadingAdditions = signal(false);

  // 📸 Signals para upload de imagen inline
  protected readonly isImageDragging = signal(false);
  protected readonly isUploadingImage = signal(false);
  protected readonly uploadImageProgress = signal(0);
  protected readonly imageEstimatedSize = signal<number | null>(null);
  protected readonly imageUploadError = signal<string | null>(null);
  protected readonly imageInput = viewChild<HTMLInputElement>('imageInput');

  // 📱 Signals para detectar móvil y orientación
  protected readonly isMobile = signal(this.checkIsMobile());
  protected readonly isPortrait = signal(this.checkIsPortrait());

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
    categoryId: ['', [Validators.required]],
    subcategoryId: [''], // ✅ Opcional
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    price: [0, [Validators.required, Validators.min(0.01)]],
    description: ['', [Validators.maxLength(500)]],
    image: ['', [Validators.pattern(/^(https?:\/\/.+)?$/)]],
    order: [0, [Validators.required]],
  });

  ngOnInit(): void {
    this.loadError.set(null);
    
    // Cargar datos
    Promise.all([
      this.productService.loadProducts(),
      this.categoryService.loadCategories(),
      this.subcategoryService.loadSubcategories(),
    ]).catch(error => {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.loadError.set(`Error cargando datos: ${msg}`);
    });

    // 📱 Detectar cambios de orientación en tiempo real
    const orientationMedia = globalThis.matchMedia?.('(orientation: portrait)');
    if (orientationMedia) {
      orientationMedia.addListener(() => {
        this.isPortrait.set(orientationMedia.matches);
      });
    }

    // 📱 Detectar cambios de tamaño de pantalla (móvil a desktop)
    const mobileMedia = globalThis.matchMedia?.('(max-width: 768px)');
    if (mobileMedia) {
      mobileMedia.addListener(() => {
        this.isMobile.set(mobileMedia.matches);
      });
    }
  }

  // 📱 Método para detectar si es móvil
  private checkIsMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 768px)').matches;
  }

  // 📱 Método para detectar si está en portrait
  private checkIsPortrait(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(orientation: portrait)').matches;
  }

  // 📱 Listener para resize
  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(this.checkIsMobile());
    this.isPortrait.set(this.checkIsPortrait());
  }

  protected getSubcategoryName(subcategoryId?: number | null): string {
    if (!subcategoryId) return 'Directo';
    return this.subcategories().find(s => s.id === subcategoryId)?.name ?? 'Sin categoría';
  }

  protected stringifyId(id: number): string {
    return String(id);
  }

  protected openCreateForm(): void {
    this.editingId.set(null);
    this.form.reset({ 
      categoryId: '', 
      subcategoryId: '', 
      name: '', 
      price: 0, 
      description: '', 
      image: '', 
      order: this.getNextOrder() 
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  protected openEditForm(product: Product): void {
    this.editingId.set(product.id);
    this.form.reset({
      categoryId: product.categoryId ? String(product.categoryId) : '',
      subcategoryId: product.subcategoryId ? String(product.subcategoryId) : '',
      name: product.name,
      price: product.price,
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
        categoryId: value.categoryId ? Number(value.categoryId) : undefined,
        subcategoryId: value.subcategoryId && value.subcategoryId !== '' ? Number(value.subcategoryId) : null,
        name: value.name ?? '',
        price: value.price ?? 0,
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
    const confirmed = await this.confirmationService.confirm({
      title: 'Eliminar producto',
      message: '¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await this.productService.deleteProduct(id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.notification.error(`Error al eliminar: ${msg}`);
    }
  }

  private getNextOrder(): number {
    const maxOrder = Math.max(0, ...this.products().map(p => p.order));
    return maxOrder + 1;
  }

  // � Métodos para gestión de adiciones por producto
  protected openAdditionsModal(product: Product): void {
    this.additionsModalProduct.set(product);
    this.loadingAdditions.set(true);

    this.additionsService.getAllAdditions().subscribe(all => {
      this.allAdditions.set(all);
      this.additionsService.getAdditionsForProduct(product.id).subscribe(linked => {
        this.productAdditionIds.set(new Set(linked.map(a => a.id)));
        this.loadingAdditions.set(false);
      });
    });
  }

  protected closeAdditionsModal(): void {
    this.additionsModalProduct.set(null);
    this.allAdditions.set([]);
    this.productAdditionIds.set(new Set());
  }

  protected toggleAddition(addition: ProductAddition): void {
    const productId = this.additionsModalProduct()?.id;
    if (!productId || !addition.id) return;

    const isLinked = this.productAdditionIds().has(addition.id);

    if (isLinked) {
      this.additionsService.removeAdditionFromProduct(productId, addition.id).subscribe({
        next: () => {
          const updated = new Set(this.productAdditionIds());
          updated.delete(addition.id);
          this.productAdditionIds.set(updated);
        },
      });
    } else {
      this.additionsService.addAdditionToProduct(productId, addition.id).subscribe({
        next: () => {
          const updated = new Set(this.productAdditionIds());
          updated.add(addition.id);
          this.productAdditionIds.set(updated);
        },
      });
    }
  }


  // �📸 Métodos para upload inline de imagen
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

      // ✅ Usar nombre del producto para generar nombre de archivo consistente
      // Al actualizar, sobrescribe automáticamente
      const productName = this.form.get('name')?.value || 'producto';
      const url = await this.imageUploadService.uploadProductImage(file, productName);

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
