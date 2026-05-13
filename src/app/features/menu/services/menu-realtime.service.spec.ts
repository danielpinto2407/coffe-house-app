import { TestBed } from '@angular/core/testing';
import { MenuRealtimeService } from './menu-realtime.service';
import { SupabaseService } from '../../../core/services/supabase.service';

describe('MenuRealtimeService', () => {
  let service: MenuRealtimeService;
  let supabaseService: jasmine.SpyObj<SupabaseService>;

  beforeEach(() => {
    const supabaseSpy = jasmine.createSpyObj('SupabaseService', [
      'query',
      'insert',
      'update',
      'delete'
    ]);

    TestBed.configureTestingModule({
      providers: [
        MenuRealtimeService,
        { provide: SupabaseService, useValue: supabaseSpy }
      ]
    });

    service = TestBed.inject(MenuRealtimeService);
    supabaseService = TestBed.inject(SupabaseService) as jasmine.SpyObj<SupabaseService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start listening to realtime changes', () => {
    spyOn(console, 'warn');
    
    // Llamar startListening
    service.startListening();

    // En navegador (window disponible), debe establecer isListening a true
    if (typeof window !== 'undefined') {
      expect(service.isListening()).toBe(true);
    }
  });

  it('should not start listening on SSR (server side)', () => {
    // Simular SSR
    const originalWindow = globalThis.window;
    (globalThis as any).window = undefined;

    spyOn(console, 'warn');
    service.startListening();

    expect(console.warn).toHaveBeenCalledWith(
      '[MenuRealtimeService] SSR detected, skipping realtime listening'
    );

    // Restaurar
    (globalThis as any).window = originalWindow;
  });

  it('should emit menu changes through observable', (done) => {
    service.menuChanged$.subscribe((event) => {
      expect(event.table).toBe('products');
      expect(event.action).toBe('INSERT');
      expect(event.recordId).toBe(1);
      done();
    });

    // Simular un cambio
    // (En tests reales, mockear el cliente de Supabase)
  });

  it('should stop listening and clean up channels', () => {
    service.stopListening();
    expect(service.isListening()).toBeFalsy();
  });
});
