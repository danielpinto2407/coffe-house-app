import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'menu',
    loadChildren: () =>
      import('./features/menu/menu.routes').then(m => m.MENU_ROUTES),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES),
  },
  {
    path: 'admin',
    canActivate: [authGuard, adminGuard],
    loadChildren: () =>
      import('./features/admin/admin.routes').then(m => m.ADMIN_ROUTES),
  },
  {
    path: '',
    redirectTo: 'menu',
    pathMatch: 'full',
  },
  {
    path: '**',
    redirectTo: 'menu',
  },
];
