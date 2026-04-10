import { Injectable, signal, computed, effect } from '@angular/core';
import { ThemeConfig, DEFAULT_THEME, getTheme, getAllThemes } from '../themes/theme.config';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly THEME_STORAGE_KEY = 'coffee-house-theme';
  
  // Signal para el tema actual
  private readonly currentThemeId = signal<string>(this.getStoredTheme());
  
  // Señal readonly para el tema activo
  currentTheme = computed(() => getTheme(this.currentThemeId()));
  
  // Señal para obtener todos los temas
  availableThemes = computed(() => getAllThemes());

  constructor() {
    // Aplicar el tema almacenado o por defecto al iniciar
    effect(() => {
      this.applyTheme(this.currentTheme());
    });
  }

  /**
   * Obtiene el tema almacenado en localStorage o retorna el theme por defecto
   */
  private getStoredTheme(): string {
    if (typeof localStorage === 'undefined') return DEFAULT_THEME;
    return localStorage.getItem(this.THEME_STORAGE_KEY) || DEFAULT_THEME;
  }

  /**
   * Cambia el tema actual y lo persiste en localStorage
   */
  setTheme(themeId: string): void {
    const theme = getTheme(themeId);
    if (theme) {
      this.currentThemeId.set(themeId);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.THEME_STORAGE_KEY, themeId);
      }
    }
  }

  /**
   * Obtiene el tema actual
   */
  getTheme(): ThemeConfig {
    return this.currentTheme();
  }

  /**
   * Obtiene el ID del tema actual
   */
  getThemeId(): string {
    return this.currentThemeId();
  }

  /**
   * Obtiene todos los temas disponibles
   */
  getAllThemes(): ThemeConfig[] {
    return this.availableThemes();
  }

  /**
   * Aplica las variables CSS del tema al documento
   */
  private applyTheme(theme: ThemeConfig): void {
    // Solo ejecutar en el navegador, no en el servidor (SSR)
    if (typeof document === 'undefined') return;
    
    const root = document.documentElement;
    const colors = theme.colors;

    // Aplicar variables CSS
    root.style.setProperty('--color-primary', colors.primary);
    root.style.setProperty('--color-secondary', colors.secondary);
    root.style.setProperty('--color-tertiary', colors.tertiary);
    root.style.setProperty('--color-accent', colors.accent);
    root.style.setProperty('--color-text', colors.text);
    root.style.setProperty('--color-text-secondary', colors.textSecondary);
    root.style.setProperty('--color-background', colors.background);
    root.style.setProperty('--color-background-light', colors.backgroundLight);
    root.style.setProperty('--color-surface', colors.surface || colors.background); // Superficie dinámica
    root.style.setProperty('--color-border', colors.border);
    root.style.setProperty('--color-success', colors.success);
    root.style.setProperty('--color-warning', colors.warning);
    root.style.setProperty('--color-error', colors.error);
    root.style.setProperty('--color-hover', colors.hover);

    // Aplicar al body para mejor compatibilidad
    document.body.style.backgroundColor = colors.background;
    document.body.style.color = colors.text;
  }

  /**
   * Alterna entre tema claro y oscuro
   */
  toggleDarkMode(): void {
    const isDark = this.currentThemeId() === 'dark';
    this.setTheme(isDark ? 'classic' : 'dark');
  }

  /**
   * Resetea al tema por defecto
   */
  resetToDefault(): void {
    this.setTheme(DEFAULT_THEME);
  }
}
