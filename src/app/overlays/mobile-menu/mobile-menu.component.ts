import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  templateUrl: './mobile-menu.component.html',
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileMenuComponent {
  // ✅ input() signal API — Angular 17+ moderno, compatible con OnPush
  readonly isOpen = input(false);
  readonly isLoggedIn = input(false);
  readonly isAdmin = input(false);
  readonly cartCount = input(0);
  readonly availableThemes = input<any[]>([]);
  readonly currentThemeId = input('');

  // ✅ output() signal API — reemplaza EventEmitter
  readonly closed = output<void>();
  readonly logout = output<void>();
  readonly themeChange = output<string>();

  close(): void {
    this.closed.emit();
  }

  selectTheme(themeId: string): void {
    this.themeChange.emit(themeId);
  }
}
