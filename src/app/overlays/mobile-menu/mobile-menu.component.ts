import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  templateUrl: './mobile-menu.component.html',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MobileMenuComponent {
  // ✅ input() signal API — Angular 17+ moderno, compatible con OnPush
  readonly isOpen = input(false);
  readonly isLoggedIn = input(false);
  readonly isAdmin = input(false);

  // ✅ output() signal API — reemplaza EventEmitter
  readonly closed = output<void>();
  readonly logout = output<void>();

  close(): void {
    this.closed.emit();
  }
}
