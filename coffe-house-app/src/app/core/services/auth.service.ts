import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { createClient, SupabaseClient, AuthError } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import { UserProfile, UserRole } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly supabase: SupabaseClient;

  private readonly _currentUser = signal<UserProfile | null>(null);
  private readonly _loading = signal(true);

  readonly currentUser = this._currentUser.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => this._currentUser() !== null);
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly userRole = computed(() => this._currentUser()?.role ?? null);

  constructor() {
    this.supabase = createClient(
      environment.supabase.url,
      environment.supabase.anonKey
    );

    if (!isPlatformBrowser(this.platformId)) {
      this._loading.set(false);
    }
  }

  /** Called via APP_INITIALIZER — browser only */
  init(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        this.loadProfile(data.session.user.id);
      } else {
        this._loading.set(false);
      }
    });

    this.supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        this.loadProfile(session.user.id);
      } else {
        this._currentUser.set(null);
        this._loading.set(false);
      }
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) throw this.mapError(error);
  }

  async signUp(email: string, password: string, fullName: string, phone: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    if (error) throw this.mapError(error);

    if (data.user) {
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          full_name: fullName,
          phone,
          role: 'customer' as UserRole,
        });
      if (profileError) throw new Error(profileError.message);
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getSupabaseClient(): SupabaseClient {
    return this.supabase;
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) {
      this._currentUser.set(null);
    } else {
      this._currentUser.set(data as UserProfile);
    }
    this._loading.set(false);
  }

  private mapError(error: AuthError): Error {
    const messages: Record<string, string> = {
      'Invalid login credentials': 'Email o contraseña incorrectos',
      'Email not confirmed': 'Confirma tu email antes de iniciar sesión',
      'User already registered': 'Este email ya está registrado',
    };
    return new Error(messages[error.message] ?? error.message);
  }
}
