/**
 * Modelo de tema para Coffee House
 * Define la estructura de colores y estilos por perfil
 */

export interface ThemeColors {
  primary: string;        // Color principal (marrón café)
  secondary: string;      // Color secundario (crema/oro)
  accent: string;         // Color de acento (verde natural)
  background: string;     // Color de fondo principal
  surface: string;        // Color de superficies secundarias
  text: {
    primary: string;      // Texto principal
    secondary: string;    // Texto secundario
    muted: string;        // Texto atenuado
  };
  border: string;         // Color de bordes
  success: string;        // Feedback positivo
  warning: string;        // Feedback de alerta
  error: string;          // Feedback de error
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

// Temas predefinidos
export const COFFEE_HOUSE_THEMES: Record<string, Theme> = {
  classic: {
    id: 'classic',
    name: 'Clásico',
    description: 'Tema clásico oscuro con tonos café',
    colors: {
      primary: '#8B6F47',
      secondary: '#D4A574',
      accent: '#3A5F2E',
      background: '#1A1A1A',
      surface: '#2A2A2A',
      text: {
        primary: '#FFFFFF',
        secondary: '#E8E8E8',
        muted: '#A0A0A0',
      },
      border: '#3A3A3A',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
  },
  light: {
    id: 'light',
    name: 'Claro',
    description: 'Tema claro para uso diurno',
    colors: {
      primary: '#8B6F47',
      secondary: '#D4A574',
      accent: '#3A5F2E',
      background: '#F5F5F5',
      surface: '#FFFFFF',
      text: {
        primary: '#212121',
        secondary: '#424242',
        muted: '#757575',
      },
      border: '#E0E0E0',
      success: '#4CAF50',
      warning: '#FF9800',
      error: '#F44336',
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Tema premium con colores más sofisticados',
    colors: {
      primary: '#6F4E37',
      secondary: '#C9A961',
      accent: '#2D5016',
      background: '#0F0F0F',
      surface: '#1F1F1F',
      text: {
        primary: '#F5F5F0',
        secondary: '#D0D0C8',
        muted: '#8B8B82',
      },
      border: '#2F2F2F',
      success: '#5CB85C',
      warning: '#F0AD4E',
      error: '#D9534F',
    },
  },
  warm: {
    id: 'warm',
    name: 'Cálido',
    description: 'Tema cálido con tonos más dorados',
    colors: {
      primary: '#A67C52',
      secondary: '#F4E4C1',
      accent: '#4A6741',
      background: '#16130A',
      surface: '#2B2620',
      text: {
        primary: '#FFF8F0',
        secondary: '#E8DCC8',
        muted: '#B0A090',
      },
      border: '#3F3A32',
      success: '#6DB369',
      warning: '#F5A623',
      error: '#E85D75',
    },
  },
};
