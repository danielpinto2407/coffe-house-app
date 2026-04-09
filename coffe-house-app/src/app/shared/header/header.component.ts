import { Component, HostListener, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MobileMenuComponent } from '../../overlays/mobile-menu/mobile-menu.component';
import { CartService } from '../../core/services/cart-service';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, MobileMenuComponent],
  templateUrl: './header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly themeService = inject(ThemeService);
  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);

  // ✅ Estado UI como signals
  protected readonly isMenuOpen = signal(false);
  protected readonly isThemeSelectorOpen = signal(false);

  // ✅ Estado derivado
  protected readonly availableThemes = computed(() => this.themeService.getAllThemes());
  protected readonly currentThemeId = computed(() => this.themeService.getThemeId());
  // ✅ toSignal: reactivo a cambios del carrito via observable, con OnPush
  protected readonly cartCount = toSignal(this.cart.count$, { initialValue: 0 });

  setTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.isThemeSelectorOpen.set(false);
  }

  toggleThemeSelector(): void {
    this.isThemeSelectorOpen.update(value => !value);
  }

  openMenu(): void {
    this.isMenuOpen.set(true);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  logout(): void {
    this.auth.signOut().finally(() => this.closeMenu());
  }

  // ✅ Cierra el menú móvil cuando la pantalla se agranda
  @HostListener('window:resize', ['$event'])
  onResize(event: Event): void {
    const target = event.target as Window;
    if (target.innerWidth >= 768 && this.isMenuOpen()) {
      this.isMenuOpen.set(false);
    }
  }
}

