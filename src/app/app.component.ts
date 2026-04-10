import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/header/header.component';
import { ProductModalComponent } from './overlays/product-modal/product-modal.component';
import { CartOverlayComponent } from './overlays/cart-overlay/cart-overlay.component';
import { NotificationContainerComponent } from './core/components/notification-container/notification-container.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, ProductModalComponent, CartOverlayComponent, NotificationContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  title = 'coffee-house-app';
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  // ✅ Ocultar header en rutas de autenticación
  readonly isAuthRoute = computed(() => {
    const url = this.router.url;
    return url.startsWith('/auth/login') || url.startsWith('/auth/register');
  });
}
