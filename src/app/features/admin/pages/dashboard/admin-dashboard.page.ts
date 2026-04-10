import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-background p-8">
      <h1 class="text-3xl font-bold text-primary mb-6">Panel de Administración</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        <a
          routerLink="/admin/products"
          class="block p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <h2 class="text-xl font-semibold text-text-primary mb-2">Productos</h2>
          <p class="text-text-secondary text-sm">Agregar, editar y eliminar productos del menú.</p>
        </a>
        <a
          routerLink="/menu"
          class="block p-6 rounded-xl border border-border bg-surface hover:border-primary transition-colors"
        >
          <h2 class="text-xl font-semibold text-text-primary mb-2">Ver Menú</h2>
          <p class="text-text-secondary text-sm">Ir al menú público de la cafetería.</p>
        </a>
      </div>
    </div>
  `,
})
export class AdminDashboardPage {}
