import { Component, OnInit, signal, computed, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, Subject, switchMap, tap, shareReplay } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductCardComponent } from '../../../shared/product-card/product-card.component';
import { SearchBarComponent } from '../../../shared/components/search-bar/search-bar.component';
import { QrModalComponent } from '../../../overlays/qr-modal/qr-modal.component';
import { MenuApiService } from '../services/menu-api.service';
import { MenuPdfService } from '../services/menu-pdf.service';
import { MenuPdfStateService } from '../services/menu-pdf-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { MenuStructure } from '../models/menu-structure.model';

@Component({
  selector: 'app-menu',
  standalone: true,
  imports: [CommonModule, ProductCardComponent, SearchBarComponent, QrModalComponent, FormsModule],
  templateUrl: './menu.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPage implements OnInit {
  private readonly menuApi = inject(MenuApiService);
  private readonly menuPdf = inject(MenuPdfService);
  protected readonly menuPdfState = inject(MenuPdfStateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthService);

  // ✅ SIGNALS: Estado reactivo moderno
  protected readonly fullMenu = signal<MenuStructure[]>([]);
  protected readonly isLoading = signal(true);

  // ✅ Auth: Verificar si es admin
  protected readonly isAdmin = computed(() => this.auth.isAdmin());

  // ✅ Estado del PDF
  protected readonly isGeneratingPdf = computed(() => this.menuPdf.isGenerating());

  // ✅ Estado del Modal QR
  protected readonly isQrModalOpen = signal(false);
  protected readonly qrCode = computed(() => this.menuPdfState.qrCode());
  protected readonly pdfUrl = computed(() => this.menuPdfState.pdfUrl());
  protected readonly isLoadingQr = computed(() => this.menuPdfState.isLoadingQr());
  protected readonly qrError = computed(() => this.menuPdfState.error());

  // ✅ COMPUTED: Menú filtrado calculado reactivamente
  protected readonly menu = computed(() => this.fullMenu());

  // ✅ Debounce para búsqueda (evita filtros excesivos)
  private readonly searchSubject = new Subject<string>();

  /**
   * ✅ Observable: Emisión del menú filtrado/completo reactivamente
   * Usa switchMap para cambiar entre búsquedas y cargar menú completo
   * SharedReplay para cachear último resultado
   */
  private readonly filteredMenu$ = this.searchSubject.pipe(
    debounceTime(300),
    tap(() => this.isLoading.set(true)),
    switchMap((term: string) => {
      if (!term?.trim()) {
        return this.menuApi.getFullMenu();
      }
      return this.menuApi.searchMenu(term);
    }),
    tap((menu: MenuStructure[]) => {
      this.fullMenu.set(menu);
      this.isLoading.set(false);
    }),
    shareReplay(1),
    takeUntilDestroyed(this.destroyRef)
  );

  constructor() {
    // ✅ Suscribirse al observable para inicializar el flujo reactivo
    this.filteredMenu$.subscribe();
  }

  ngOnInit(): void {
    // ✅ Emitir un término vacío para cargar el menú completo inicial
    // Esto evita una doble llamada API (vs hacerlo en ngOnInit)
    this.searchSubject.next('');
  }

  /**
   * ✅ Listener para eventos de búsqueda del SearchBar
   * Usa Subject + debounce para no filtrar a cada keystroke
   */
  onSearch(term: string): void {
    this.searchSubject.next(term);
  }

  /**
   * ✅ Genera el PDF del menú y lo sube a Supabase
   * Orquesta: generación de PDF → carga a Supabase → generación de QR
   * Solo permitido para usuarios con rol admin
   */
  async onGenerateMenuPdf(): Promise<void> {
    // ✅ Validar que solo admin pueda hacerlo
    if (!this.auth.isAdmin()) {
      console.warn('⚠️ Solo administradores pueden generar el menú');
      return;
    }

    try {
      const menuData = this.fullMenu();
      
      if (!menuData?.length) {
        console.warn('⚠️ No hay menú disponible para generar');
        return;
      }

      console.log('⏳ Generando PDF del menú...');
      const pdfBlob = await this.menuPdf.generateMenuPdfBlob(menuData);
      
      if (!pdfBlob?.size) {
        throw new Error('PDF generado está vacío');
      }

      console.log('📤 Subiendo PDF a Supabase y generando QR...');
      await this.menuPdfState.uploadPdfAndGenerateQr(pdfBlob);
      console.log('✅ PDF cargado y QR generado exitosamente');
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error al generar PDF:', errorMsg);
      // TODO: Mostrar notificación visual al usuario (toast/snackbar)
    }
  }

  /**
   * ✅ Visualiza el menú mostrando el QR del PDF existente en Supabase
   * Si existe un PDF previo, lo carga y genera el QR
   * Si no existe, muestra un mensaje indicando que debe generarlo primero
   */
  async onViewMenuQr(): Promise<void> {
    try {
      console.log('⏳ Cargando PDF existente desde Supabase...');
      await this.menuPdfState.loadExistingPdfAndQr();
      this.isQrModalOpen.set(true);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
      console.warn('⚠️ No hay menú disponible:', errorMsg);
      // TODO: Mostrar toast/snackbar informando al usuario
      return;
    }
  }

  /**
   * ✅ Cierra el modal QR
   */
  closeQrModal(): void {
    this.isQrModalOpen.set(false);
  }
}

