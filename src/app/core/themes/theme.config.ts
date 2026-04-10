export interface ThemeConfig {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
    accent: string;
    text: string;
    textSecondary: string;
    background: string;
    backgroundLight: string;
    surface: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    hover: string;
    // Nuevos tokens extraídos del logo
    rose: string;       // Rosa empolvado de las flores del logo
    berry: string;      // Rojo de las bayas de café
    cream: string;      // Crema del fondo del medallón
  };
}

export const THEMES: Record<string, ThemeConfig> = {
  classic: {
    id: 'classic',
    name: 'Clásico',
    colors: {
      // Marrón chocolatero profundo del logo
      primary: '#5C2E10',
      // Dorado antiguo del borde y detalles
      secondary: '#D4A96A',
      // Crema envejecida del medallón
      tertiary: '#F5E6CC',
      // Dorado oscuro de los detalles metálicos
      accent: '#B8860B',
      // Marrón muy oscuro para texto (máximo contraste)
      text: '#2C1408',
      textSecondary: '#7A4B2A',
      // Blanco cálido con toque crema
      background: '#EDD9A333',
      backgroundLight: '#F5E6CC',
      surface: '#FFFFFF',
      border: '#C8A96E',
      success: '#3A6B35',
      warning: '#C8780A',
      error: '#A83228',
      hover: '#EDD9A3',
      // Extras del logo
      rose: '#C97A6E',    // Rosa empolvado de las flores
      berry: '#B5442A',   // Rojo de las bayas de café
      cream: '#EDD9A3',   // Crema del medallón
    },
  },

  dark: {
    id: 'dark',
    name: 'Oscuro',
    colors: {
      // Dorado cálido brillante sobre fondo oscuro
      primary: '#D4A56A',
      secondary: '#8B6040',
      tertiary: '#261A0C',
      accent: '#E6C77F',
      text: '#F0E6D0',
      textSecondary: '#C9A87A',
      // Negro ámbar — inspirado en el café espresso
      background: '#1A1008',
      backgroundLight: '#261A0C',
      surface: '#2F1F0E',      // Cards más oscuras pero con calidez
      border: '#4A3520',
      success: '#7AB87A',
      warning: '#E6C55A',
      error: '#D4604A',
      hover: '#3D2A14',
      // Extras del logo (versión oscura)
      rose: '#B06060',
      berry: '#8B3520',
      cream: '#3D2E1A',
    },
  },

  botanico: {
    id: 'botanico',
    name: 'Botánico',
    colors: {
      // Verde musgo profundo de las hojas del logo
      primary: '#2D3A22',
      // Verde musgo medio
      secondary: '#8FA67A',
      // Verde muy claro
      tertiary: '#D0E0C0',
      // Marrón café como acento cálido
      accent: '#8B5A2B',
      // Verde oscuro para texto
      text: '#1E2A16',
      textSecondary: '#5A7044',
      // Pergamino envejecido — el fondo del medallón
      background: '#F4F0E6',
      backgroundLight: '#E8E0C8',
      surface: '#FDFBF5',
      border: '#8FA67A',
      success: '#3A6B35',
      warning: '#C8780A',
      error: '#A83228',
      hover: '#D8E8C8',
      // Extras del logo
      rose: '#C8907A',    // Rosa de las flores
      berry: '#B5442A',   // Bayas de café rojas
      cream: '#E8E0C8',   // Pergamino del fondo
    },
  },
};

export const DEFAULT_THEME = 'classic';

export function getTheme(themeId: string): ThemeConfig {
  return THEMES[themeId] || THEMES[DEFAULT_THEME];
}

export function getAllThemes(): ThemeConfig[] {
  return Object.values(THEMES);
}