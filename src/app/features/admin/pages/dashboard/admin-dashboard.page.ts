import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { MenuPdfService } from '../../../menu/services/menu-pdf.service';
import { MenuPdfStateService } from '../../../menu/services/menu-pdf-state.service';
import { MenuApiService } from '../../../menu/services/menu-api.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { QrModalComponent } from '../../../../overlays/qr-modal/qr-modal.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, QrModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background p-8">
      <h1 class="text-3xl font-bold text-primary mb-6">Panel de Administración</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl">
        <a
          routerLink="/admin/categories"
          class="block p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="material-icons text-primary text-2xl">category</span>
            <h2 class="text-xl font-semibold text-text">Categorías</h2>
          </div>
          <p class="text-text-secondary text-sm">Gestionar las categorías principales del menú.</p>
        </a>
        <a
          routerLink="/admin/subcategories"
          class="block p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="material-icons text-primary text-2xl">subdirectory_arrow_right</span>
            <h2 class="text-xl font-semibold text-text">Subcategorías</h2>
          </div>
          <p class="text-text-secondary text-sm">Gestionar subcategorías dentro de categorías.</p>
        </a>
        <a
          routerLink="/admin/products"
          class="block p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="material-icons text-primary text-2xl">local_dining</span>
            <h2 class="text-xl font-semibold text-text">Productos</h2>
          </div>
          <p class="text-text-secondary text-sm">Agregar, editar y eliminar productos del menú.</p>
        </a>
        
        <a
          routerLink="/admin/additions"
          class="block p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="material-icons text-primary text-2xl">add_circle</span>
            <h2 class="text-xl font-semibold text-text">Adiciones</h2>
          </div>
          <p class="text-text-secondary text-sm">Gestionar adiciones y personalizaciones de productos.</p>
        </a>

        <!-- ✅ NUEVA TARJETA: Menú PDF/QR -->
        <div class="block p-6 rounded-xl border border-border bg-surface hover:border-secondary transition-colors cursor-pointer"
             (click)="togglePdfActions()">
          <div class="flex items-center gap-3 mb-2">
            <span class="material-icons text-secondary text-2xl">description</span>
            <h2 class="text-xl font-semibold text-text">Menú PDF</h2>
          </div>
          <p class="text-text-secondary text-sm">Generar PDF del menú y crear código QR.</p>
          
          <!-- Acciones expandibles -->
          @if (showPdfActions()) {
            <div class="mt-4 flex flex-col gap-2">
              <button
                type="button"
                (click)="onGenerateMenuPdf($event)"
                [disabled]="isGeneratingPdf()"
                class="w-full flex items-center justify-center gap-2 bg-secondary text-primary px-3 py-2 rounded-lg font-medium text-sm
                       hover:bg-accent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons text-lg">{{ isGeneratingPdf() ? 'hourglass_empty' : 'save' }}</span>
                {{ isGeneratingPdf() ? 'Generando...' : 'Generar PDF' }}
              </button>
              <button
                type="button"
                (click)="onViewMenuQr($event)"
                [disabled]="isLoadingQr()"
                class="w-full flex items-center justify-center gap-2 bg-primary text-white px-3 py-2 rounded-lg font-medium text-sm
                       hover:bg-accent transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <span class="material-icons text-lg">{{ isLoadingQr() ? 'hourglass_empty' : 'qr_code_2' }}</span>
                {{ isLoadingQr() ? 'Cargando...' : 'Ver QR' }}
              </button>
            </div>
          }
        </div>

        <a
          routerLink="/menu"
          class="block p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <div class="flex items-center gap-3 mb-2">
            <span class="material-icons text-primary text-2xl">restaurant_menu</span>
            <h2 class="text-xl font-semibold text-text">Ver Menú</h2>
          </div>
          <p class="text-text-secondary text-sm">Ir al menú público de la cafetería.</p>
        </a>
      </div>

      <!-- ✅ Modal QR -->
      <app-qr-modal
        [isOpen]="isQrModalOpen()"
        [qrCode]="qrCode()"
        [pdfUrl]="pdfUrl()"
        [isLoading]="isLoadingQr()"
        [error]="qrError()"
        (closed)="closeQrModal()">
      </app-qr-modal>
    </div>
  `,
})
export class AdminDashboardPage {
  private readonly menuPdf = inject(MenuPdfService);
  private readonly menuPdfState = inject(MenuPdfStateService);
  private readonly menuApi = inject(MenuApiService);
  private readonly notification = inject(NotificationService);

  protected readonly showPdfActions = signal(false);
  protected readonly isGeneratingPdf = computed(() => this.menuPdf.isGenerating());
  protected readonly isLoadingQr = computed(() => this.menuPdfState.isLoadingQr());
  protected readonly isQrModalOpen = signal(false);
  protected readonly qrCode = computed(() => this.menuPdfState.qrCode());
  protected readonly pdfUrl = computed(() => this.menuPdfState.pdfUrl());
  protected readonly qrError = computed(() => this.menuPdfState.error());

  togglePdfActions(): void {
    this.showPdfActions.update(val => !val);
  }

  async onGenerateMenuPdf(event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const menuData = await firstValueFrom(this.menuApi.getFullMenu());
      if (!menuData?.length) {
        this.notification.warning('No hay menú disponible');
        return;
      }
      const pdfBlob = await this.menuPdf.generateMenuPdfBlob(menuData);
      await this.menuPdfState.uploadPdfAndGenerateQr(pdfBlob);
      this.notification.success('✅ PDF generado exitosamente');
    } catch (error) {
      this.notification.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  async onViewMenuQr(event: Event): Promise<void> {
    event.stopPropagation();
    try {
      await this.menuPdfState.loadExistingPdfAndQr();
      this.isQrModalOpen.set(true);
      this.notification.success('QR cargado');
    } catch (error) {
      this.notification.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  closeQrModal(): void {
    this.isQrModalOpen.set(false);
  }
}
