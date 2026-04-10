/**
 * Definición de temas de colores para Coffee House
 * Sistemas configurables de paletas personalizadas
 */

export type ThemeName = 'classic' | 'dark' | 'premium' | 'natural';

export interface Theme {
  name: ThemeName;
  label: string;
  colors: {
    primary: string;        // Color principal (marrón)
    secondary: string;      // Color secundario (oro)
    tertiary: string;       // Color terciario (crema)
    accent: string;         // Color de acento (énfasis)
    background: string;     // Fondo principal
    surface: string;        // Superficie secundaria
    text: string;          // Texto principal
    textSecondary: string; // Texto secundario
    border: string;        // Bordes
    error: string;         // Color de error
    success: string;       // Color de éxito
    warning: string;       // Color de advertencia
    hover: string;         // Hover state
  };
}

export const THEMES: Record<ThemeName, Theme> = {
  /**
   * Tema Clásico - Inspirado en la carta original
   * Colores cálidos y naturales de café
   */
  classic: {
    name: 'classic',
    label: 'Clásico',
    colors: {
      primary: '#8B6F47',      // Marrón café principal
      secondary: '#D4A574',    // Oro/crema cálido
      tertiary: '#F5E6D3',     // Crema suave
      accent: '#ffe082',       // Dorado suave
      background: '#FFFBF5',   // Fondo crema muy claro
      surface: '#D4A574',      // Blanco puro
      text: '#2C2416',         // Marrón oscuro para texto
      textSecondary: '#8B6F47',// Marrón para textos secundarios
      border: '#D4A574',       // Bordes en oro
      error: '#D32F2F',        // Rojo suave
      success: '#3A5F2E',      // Verde natural
      warning: '#F57C00',      // Naranja
      hover: '#A0846B',        // Marrón más oscuro para hover
    },
  },

  /**
   * Tema Oscuro - Elegante y moderno
   * Perfecto para ambiente nocturno
   */
  dark: {
    name: 'dark',
    label: 'Oscuro',
    colors: {
      primary: '#1A1a1a',      // Negro muy oscuro
      secondary: '#D4A574',    // Oro (contraste)
      tertiary: '#2C2416',     // Marrón muy oscuro
      accent: '#FFD54F',       // Dorado más brillante
      background: '#0F0F0F',   // Fondo negro profundo
      surface: '#1E1E1E',      // Superficie gris oscuro
      text: '#FFFFFF',         // Texto blanco
      textSecondary: '#D4A574',// Texto en oro
      border: '#3A3A3A',       // Bordes grises oscuros
      error: '#FF6B6B',        // Rojo brillante
      success: '#66BB6A',      // Verde brillante
      warning: '#FFB74D',      // Naranja brillante
      hover: '#FFD54F',        // Dorado para hover
    },
  },

  /**
   * Tema Premium - Lujo y sofisticación
   * Para eventos especiales y menú gastronómico
   */
  premium: {
    name: 'premium',
    label: 'Premium',
    colors: {
      primary: '#3A3A3A',      // Gris muy oscuro elegante
      secondary: '#D4AF37',    // Oro real/premium
      tertiary: '#E8D7C3',     // Crema más cálida
      accent: '#FFE082',       // Dorado complementario
      background: '#F9F7F4',   // Fondo marfil suave
      surface: '#FFFEF9',      // Blanco con tono cálido
      text: '#1A1A1A',         // Negro puro
      textSecondary: '#555555',// Gris charcoal
      border: '#D4AF37',       // Bordes oro
      error: '#C62828',        // Rojo profundo
      success: '#2E7D32',      // Verde profundo
      warning: '#E65100',      // Naranja profundo
      hover: '#D4AF37',        // Oro para hover
    },
  },

  /**
   * Tema Natural - Orgánico y eco-friendly
   * Enfoque en colores naturales y sostenibilidad
   */
  natural: {
    name: 'natural',
    label: 'Natural',
    colors: {
      primary: '#5D4E37',      // Marrón tierra
      secondary: '#A89968',    // Beige natural
      tertiary: '#F4EBE0',     // Crema natural
      accent: '#8B7355',       // Marrón cálido
      background: '#FEFDFB',   // Blanco hueso
      surface: '#F5F3F0',      // Gris natural
      text: '#3E3E3E',         // Gris charcoal
      textSecondary: '#6B6B6B',// Gris medio
      border: '#D9CDBF',       // Borde natural
      error: '#C8102E',        // Rojo natural
      success: '#4A7C59',      // Verde bosque
      warning: '#D9690F',      // Naranja natural
      hover: '#8B7355',        // Marrón para hover
    },
  },
};

/**
 * Tema por defecto del sistema
 */
export const DEFAULT_THEME: ThemeName = 'classic';

/**
 * Lista de todos los temas disponibles
 */
export const AVAILABLE_THEMES = Object.values(THEMES);
