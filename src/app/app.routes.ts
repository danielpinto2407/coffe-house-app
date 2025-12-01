import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'menu',
    loadChildren: () =>
      import('./features/menu/menu.routes').then(r => r.MENU_ROUTES),
  },
  { path: '', redirectTo: 'menu', pathMatch: 'full' },
];
