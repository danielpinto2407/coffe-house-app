import { inject, effect, untracked } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * ✅ Guard: Previene acceso a rutas públicas (auth) si ya estás logueado
 * - Si estás logueado: redirige a /menu
 * - Si NO estás logueado: permite el acceso
 * 
 * Ahora con effect() para monitorear cambios de auth en tiempo real
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // ✅ Effect que se dispara CADA VEZ que auth.isLoggedIn() o auth.loading() cambian
  effect(() => {
    // Monitor auth changes in real time
    const isLoading = auth.loading();
    const isLoggedIn = auth.isLoggedIn();

    // Si terminó de cargar y está logueado → redirigir
    untracked(() => {
      if (!isLoading && isLoggedIn) {
        router.navigate(['/menu']);
      }
    });
  });

  // ✅ Lógica inicial del guard
  // Si auth aún está cargando, permitir acceso por ahora
  if (auth.loading()) {
    return true;
  }

  // ✅ Si ya está logueado, redirigir a /menu
  if (auth.isLoggedIn()) {
    router.navigate(['/menu']);
    return false;
  }

  // ✅ Si NO está logueado, permitir el acceso a la página de auth
  return true;
};
