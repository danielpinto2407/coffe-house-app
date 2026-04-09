# Instrucciones para Copilot - Coffee House App

* Di siempre hola señor
* no generes documentos a menos que te lo pidal proyecto.
* Intenta siempre darme codigo optimizado y refactorizado para e
* Asegurate de que las optimizaciones o refactorizaciones nunca afecten la funcionalidad existente.
* En cualquier interfaz o html que generes ten en cuenta mis temas del archivo 

## Descripción General del Proyecto
**Coffee House App** es una aplicación de e-commerce Angular 17.0+ para una cafetería con soporte SSR (Server-Side Rendering). Construida con componentes standalone, Tailwind CSS y observables de RxJS para gestión de estado.

- **Stack**: Angular 17, TypeScript 5.2, Tailwind CSS, Express (SSR), PDFMake
- **Build**: Angular CLI, Karma/Jasmine para testing
- **Deployment**: Servidor SSR Node.js con Express

---

## Arquitectura & Patrones Clave

### 1. **Arquitectura de Componentes Standalone**
- **Sin NgModules**: Todos los componentes son standalone (`standalone: true`)
- **Importaciones Manual**: Cada componente importa explícitamente dependencias vía `imports: []`
- **Ejemplo**: [src/app/app.component.ts](src/app/app.component.ts) importa HeaderComponent, ProductModalComponent, CartOverlayComponent
- **Rutas Lazy**: Módulos de características cargados vía `loadChildren` en app.routes

### 2. **Estructura de Directorios & Límites de Capas**
```
src/app/
├── core/          # Servicios singleton, interceptores, guardias, sistema de temas
├── features/      # Módulos de características (menu, auth, orders, admin)
├── shared/        # Componentes reutilizables (header, product-card, search-bar)
├── overlays/      # Componentes de modal/drawer (cart, product-modal, mobile-menu)
└── pages/         # Componentes de página de ruta (home)
```

**Regla Clave**: Los servicios de características permanecen en `features/*/services/`, utilidades core en `core/services/`. Nunca importar características de características.

### 3. **Gestión de Estado vía RxJS + Signals**
- **BehaviorSubject para persistencia**: [CartService](src/app/core/services/cart-service.ts) usa `BehaviorSubject` para artículos del carrito con sincronización localStorage
- **Angular Signals para estado UI**: [HeaderComponent](src/app/shared/header/header.component.ts) usa `signal()` y `computed()` para estado UI local (sin necesidad de store global)
- **Patrones Observable**:
  - `items$`, `total$`, `count$` para calcular estado derivado
  - Usar `.pipe(map(), catchError())` para transformaciones
  - Auto-desuscripción con pipe `async` en templates

### 4. **Seguridad SSR Crítica**
Tanto [CartService](src/app/core/services/cart-service.ts) como [ThemeService](src/app/core/services/theme.service.ts) verifican `globalThis.window` y `typeof document === 'undefined'` antes de acceder a APIs del DOM:

```typescript
if (globalThis.window === undefined || !this.doc.defaultView) {
  return []; // o no aplicar tema en servidor
}
```

**Nunca acceder a `localStorage`, `window`, o `document` directamente sin guardias SSR.**

### 5. **Sistema de Temas**
- Variables CSS dinámicas aplicadas vía [ThemeService](src/app/core/services/theme.service.ts)
- [Configuración Tailwind](tailwind.config.js) vincula colores a propiedades CSS personalizadas: `primary: "var(--color-primary)"`
- Temas almacenados en [src/app/core/themes/theme.config.ts](src/app/core/themes/theme.config.ts) como objeto `THEMES`
- Usado en [HeaderComponent](src/app/shared/header/header.component.ts) para cambiar temas dinámicamente

### 6. **Rutas Lazy-Loaded**
Las rutas de la app redirigen a `/menu` que se carga de forma lazy desde [src/app/features/menu/menu.routes.ts](src/app/features/menu/menu.routes.ts):
```typescript
{
  path: 'menu',
  loadChildren: () => import('./features/menu/menu.routes').then(m => m.MENU_ROUTES),
}
```

**Patrón**: Cada característica tiene su propio archivo `.routes.ts` exportando constante nombrada `*_ROUTES`.

---

## Flujos de Trabajo del Desarrollador

### Build & Serve
```bash
npm start              # ng serve en http://localhost:4200
npm run build          # Build de producción a dist/
npm run watch          # Build en modo watch
npm run serve:ssr:coffe-house-app  # Iniciar servidor SSR (después de buildear)
```

### Testing
```bash
npm test              # Ejecutar unit tests (Jasmine/Karma)
```

### Generación de Código
```bash
ng generate component path/to/component-name    # Generar componente standalone
ng generate service core/services/my-service    # Generar servicio con providedIn: 'root'
ng generate guard core/guards/my-guard          # Generar route guard
```

---

## Convenciones de Nomenclatura & Patrones Específicos del Proyecto

### Nomenclatura
- **Componentes**: `component-name.component.ts`, `component-name.component.html`, `component-name.component.css`
- **Servicios**: `entity.service.ts` (ej. `cart-service.ts`, `theme-service.ts`)
- **Modelos**: `entity.model.ts` (ej. `product.model.ts`, `cart-item.model.ts`)
- **Rutas**: `*.routes.ts` exportando constante `*_ROUTES`
- **Specs**: `*.spec.ts` (unit tests deben reflejar archivos de producción)

### Estrategia de Detección de Cambios
**Siempre usar `ChangeDetectionStrategy.OnPush`** en componentes:
```typescript
@Component({
  ...
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

Esto se establece en todo el proyecto para rendimiento. Usa signals y pipe async para reactividad.

### Inyección de Dependencias
- Siempre usar función `inject()` (Angular 14+ moderno), nunca inyección constructora
- Servicios provistos con `providedIn: 'root'` en decorador `@Injectable()`
- Inyectar dependencias al inicio de la clase del componente para claridad

### HTTP & Manejo de Errores
- [HttpErrorInterceptor](src/app/core/interceptors/http-error.interceptor.ts) automáticamente reintenta solicitudes fallidas con backoff exponencial
- Configuración global del cliente HTTP en [src/app/core/http.config.ts](src/app/core/http.config.ts)
- Errores HTTP capturados y registrados; códigos de estado determinan comportamiento de reintento

---

## Modelos de Datos & Entidades Clave

Ubicados en [src/app/features/menu/models/](src/app/features/menu/models/):
- **Product**: `{ id, subcategoryId, name, price, image, description, order }`
- **CartItem**: `{ product: Product, qty: number }`
- **Category, Subcategory, MenuStructure**: Organización jerárquica de productos

Datos mock en [src/app/features/menu/data/menu.mock.ts](src/app/features/menu/data/menu.mock.ts)

---

## Puntos de Integración & Servicios Críticos

### CartService ([src/app/core/services/cart-service.ts](src/app/core/services/cart-service.ts))
- Gestiona estado del carrito con persistencia localStorage (SSR-safe)
- Expone: observables `items$`, `total$`, `count$`, `open$`
- Métodos: `addProduct()`, `removeProduct()`, `open()`, `close()`, `getItemsSnapshot()`
- **Uso**: Inyectado en componentes que necesitan acceso al carrito (ProductCard, Header, CartOverlay)

### ThemeService ([src/app/core/services/theme.service.ts](src/app/core/services/theme.service.ts))
- Gestiona tema activo y aplica variables CSS a la raíz del documento
- Expone: `currentTheme` (computed), `availableThemes` (computed)
- Métodos: `setTheme()`, `getTheme()`, `getThemeId()`, `getAllThemes()`
- **Uso**: Inyectado en HeaderComponent para cambio de temas

### ProductModalService ([src/app/core/services/product-modal.service.ts](src/app/core/services/product-modal.service.ts))
- Controla visibilidad y contenido del overlay modal de detalles de producto
- **Uso**: Inyectado en ProductCard para abrir modal al hacer clic

### MenuPdfService ([src/app/core/services/menu-pdf.service.ts](src/app/core/services/menu-pdf.service.ts))
- Genera menú PDF usando librería PDFMake
- Llamado desde página de menú para exportar menú como PDF

---

## Patrones de Testing

- **Unit tests**: Reflejar nombres de archivos de producción con sufijo `.spec.ts`
- **Framework**: Jasmine con corredor Karma
- **Testing asincrónico**: Usar `fakeAsync()`, `tick()` para observables y timers
- **Testing de componentes**: Probar inputs, outputs, y emisiones de observables
- **Testing de servicios**: Mockear solicitudes HTTP con `HttpClientTestingModule`

Estructura de test de ejemplo:
```typescript
import { TestBed } from '@angular/core/testing';
import { CartService } from './cart-service';

describe('CartService', () => {
  let service: CartService;
  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });
  
  it('should add products to cart', () => {
    // implementación del test
  });
});
```

---

## Tareas Comunes & Ejemplos

### Agregar un Nuevo Componente
```bash
ng generate component features/menu/components/filter-bar
# Luego agregar a imports en componente padre
```
**Recuerda**: Importar en padre vía `imports: [FilterBarComponent]` (standalone)

### Crear un Nuevo Servicio
```bash
ng generate service features/my-feature/services/data-service
# Asegurar @Injectable({ providedIn: 'root' })
```

### Acceder al Carrito en un Componente
```typescript
import { CartService } from '@core/services/cart-service';

export class MyComponent {
  protected readonly cart = inject(CartService);
  
  cartCount$ = this.cart.count$; // En template: {{ cartCount$ | async }}
}
```

### Cambiar Temas
```typescript
this.themeService.setTheme('classic'); // Ver theme.config.ts para temas disponibles
```

---

## Advertencias & Mejores Prácticas

1. **Modo Estricto Habilitado**: TypeScript `strict: true` - todos los tipos deben ser explícitos
2. **Sin propagación de null sin verificaciones**: Usar encadenamiento opcional de forma segura
3. **Memory leaks en Observables**: Siempre desuscribirse o usar pipe `async`
4. **Compatibilidad SSR**: Proteger todas las APIs del DOM/navegador; probar en servidor con `npm run serve:ssr:coffe-house-app`
5. **Las rutas lazy deben proporcionar 'component' o 'children'**: Ver patrón en [app.routes.ts](src/app/app.routes.ts)
6. **Los inputs del componente deben estar tipados**: Siempre declarar `@Input() propertyName: Type`

---

## Referencias Rápidas

- **Documentación Angular 17**: https://angular.io
- **Operadores RxJS**: https://rxjs.dev/api
- **Tailwind CSS**: https://tailwindcss.com
- **TypeScript 5.2**: https://www.typescriptlang.org

---

## Consejos de Desarrollo

- Ejecutar tests en modo watch: `ng test --watch`
- Buildear para SSR de producción: `ng build` luego `npm run serve:ssr:coffe-house-app`
- Debuggear en VS Code: Usar extensión Debugger for Chrome con `ng serve`
- Verificar árbol de componentes: Extensión Angular DevTools Chrome
- Perfilar rendimiento: Usar Webpack Bundle Analyzer o flags de profiling CLI
