import { Injectable, inject } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry, finalize } from 'rxjs/operators';
import { httpConfig } from '../http.config';

/**
 * ✅ HTTP Error Interceptor
 * Maneja errores globales, reintentos y logging
 */
@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  private readonly router = inject(Router);

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // ✅ Log de petición
    console.log(`📤 HTTP ${req.method} → ${req.url}`);

    return next.handle(req).pipe(
      // ✅ Reintentos automáticos para códigos específicos
      retry({
        count: this.shouldRetry(req) ? httpConfig.retryAttempts : 0,
        delay: (error: HttpErrorResponse, retryCount: number) => {
          if (!this.isRetryableError(error)) {
            throw error;
          }
          // ✅ Real exponential backoff: 1s, 2s, 4s...
          const delayMs = Math.pow(2, retryCount - 1) * 1000;
          return timer(delayMs);
        }
      }),

      // ✅ Manejo de errores
      catchError((error: HttpErrorResponse) => {
        return this.handleError(error, req);
      }),

      // ✅ Log de finalización
      finalize(() => {
        console.log(`✅ HTTP completado: ${req.url}`);
      })
    );
  }

  /**
   * Determina si una petición debe ser reintentada
   */
  private shouldRetry(req: HttpRequest<any>): boolean {
    // Solo reintentar GET y métodos idempotentes
    return ['GET', 'HEAD', 'DELETE'].includes(req.method);
  }

  /**
   * Determina si un error es reintentable
   */
  private isRetryableError(error: HttpErrorResponse): boolean {
    return httpConfig.retryableStatusCodes.includes(error.status);
  }

  /**
   * Manejo centralizado de errores
   */
  private handleError(
    error: HttpErrorResponse,
    req: HttpRequest<any>
  ): Observable<never> {
    let errorMessage = 'Error desconocido';

    if (error.error instanceof ErrorEvent) {
      // Error del cliente (network error, etc)
      errorMessage = `Error: ${error.error.message}`;
      console.error('🔥 Client Error:', error.error);
    } else {
      // Error del servidor
      errorMessage = `${error.status}: ${error.statusText || 'Error en servidor'}`;
      console.error(`🔥 Server Error: ${error.status} - ${req.url}`, error.error);
    }

    // ✅ Manejo específico de códigos
    switch (error.status) {
      case 0:
        errorMessage = 'No hay conexión a internet';
        break;
      case 400:
        errorMessage = 'Solicitud inválida';
        break;
      case 401:
        errorMessage = 'No autorizado - por favor inicia sesión';
        // ✅ Redirigir a login
        this.router.navigate(['/auth/login']).catch(err => 
          console.error('Error navigating to login:', err)
        );
        break;
      case 403:
        errorMessage = 'Acceso denegado';
        break;
      case 404:
        errorMessage = 'Recurso no encontrado';
        break;
      case 408:
        errorMessage = 'Timeout - la petición tardó demasiado';
        break;
      case 429:
        errorMessage = 'Demasiadas peticiones - intenta más tarde';
        break;
      case 500:
      case 502:
      case 503:
      case 504:
        errorMessage = 'Error del servidor - intenta más tarde';
        break;
    }

    return throwError(() => ({
      message: errorMessage,
      statusCode: error.status,
      originalError: error
    }));
  }
}
