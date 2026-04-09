import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/admin-products.page').then(m => m.AdminProductsPage),
  },
];
