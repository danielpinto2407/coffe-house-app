import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/dashboard/admin-dashboard.page').then(m => m.AdminDashboardPage),
  },
  {
    path: 'categories',
    loadComponent: () =>
      import('./pages/categories/admin-categories.page').then(m => m.AdminCategoriesPage),
  },
  {
    path: 'subcategories',
    loadComponent: () =>
      import('./pages/subcategories/admin-subcategories.page').then(m => m.AdminSubcategoriesPage),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./pages/products/admin-products.page').then(m => m.AdminProductsPage),
  },
  {
    path: 'additions',
    loadComponent: () =>
      import('./pages/admin-additions-page/admin-additions-page.component').then(m => m.AdminAdditionsPageComponent),
  },
];
