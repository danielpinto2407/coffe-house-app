/**
 * ✅ Configuración centralizada HTTP
 * Punto único de configuración para todas las peticiones HTTP
 */

export const httpConfig = {
  // ✅ Base URL para API
  baseUrl: 'https://api.example.com/v1',

  // ✅ Timeouts
  timeout: 30000, // 30 segundos
  shortTimeout: 5000, // 5 segundos para operaciones cortas

  // ✅ Reintentos
  retryAttempts: 3,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],

  // ✅ Headers comunes
  defaultHeaders: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },

  // ✅ Endpoints
  endpoints: {
    menu: '/menu',
    products: '/products',
    cart: '/cart',
    orders: '/orders',
    auth: '/auth'
  }
};

/**
 * Tipos para respuestas API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  timestamp: string;
}
