/**
 * Contexte pour la gestion du thème de l'application
 * Permet de basculer entre les modes clair et sombre
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName, useColorScheme } from 'react-native';
import { loadUserPreferences, saveThemePreference } from '../services/storageService';
import { COLORS } from '../utils/constants';

// Interface pour les couleurs du thème
export interface ThemeColors {
  // Couleurs principales
  primary: string;
  secondary: string;
  success: string;
  error: string;
  warning: string;
  info: string;
  
  // Arrière-plans
  background: string;
  card: string;
  input: string;
  
  // Texte
  text: string;
  textSecondary: string;
  textLight: string;
  textDark: string;
  
  // Éléments d'interface
  border: string;
  shadow: string;
  overlay: string;
  
  // États interactifs
  focused: string;
  pressed: string;
  disabled: string;
  
  // Couleurs spécifiques
  alarmActive: string;
  alarmInactive: string;
  snooze: string;
  dismiss: string;
}

// Couleurs du thème clair
export const lightThemeColors: ThemeColors = {
  primary: COLORS.PRIMARY,
  secondary: COLORS.SECONDARY,
  success: COLORS.SUCCESS,
  error: COLORS.ERROR,
  warning: COLORS.WARNING,
  info: COLORS.INFO,
  
  background: COLORS.BACKGROUND_LIGHT,
  card: '#ffffff',
  input: '#f8f8f8',
  
  text: COLORS.TEXT_DARK,
  textSecondary: COLORS.GRAY_DARK,
  textLight: COLORS.TEXT_LIGHT,
  textDark: COLORS.TEXT_DARK,
  
  border: COLORS.GRAY_LIGHT,
  shadow: 'rgba(0, 0, 0, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  focused: `${COLORS.PRIMARY}40`, // 40 = 25% opacité
  pressed: `${COLORS.PRIMARY}20`, // 20 = 12% opacité
  disabled: COLORS.GRAY_LIGHT,
  
  alarmActive: COLORS.PRIMARY,
  alarmInactive: COLORS.GRAY,
  snooze: COLORS.WARNING,
  dismiss: COLORS.INFO
};

// Couleurs du thème sombre
export const darkThemeColors: ThemeColors = {
  primary: COLORS.PRIMARY,
  secondary: COLORS.SECONDARY,
  success: COLORS.SUCCESS,
  error: COLORS.ERROR,
  warning: COLORS.WARNING,
  info: COLORS.INFO,
  
  background: COLORS.BACKGROUND_DARK,
  card: '#1e1e1e',
  input: '#2c2c2c',
  
  text: COLORS.TEXT_LIGHT,
  textSecondary: COLORS.GRAY_LIGHT,
  textLight: COLORS.TEXT_LIGHT,
  textDark: COLORS.TEXT_DARK,
  
  border: COLORS.GRAY_DARK,
  shadow: 'rgba(0, 0, 0, 0.3)',
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  focused: `${COLORS.PRIMARY}40`, // 40 = 25% opacité
  pressed: `${COLORS.PRIMARY}20`, // 20 = 12% opacité
  disabled: COLORS.GRAY_DARK,
  
  alarmActive: COLORS.PRIMARY,
  alarmInactive: COLORS.GRAY,
  snooze: COLORS.WARNING,
  dismiss: COLORS.INFO
};

// Interface pour les espacements
export interface ThemeSpacing {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
  xxl: number;
}

// Valeurs d'espacement
export const spacing: ThemeSpacing = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 48
};

// Interface pour la typographie
export interface ThemeTypography {
  fontFamily: {
    regular: string;
    medium: string;
    bold: string;
  };
  fontSize: {
    xs: number;
    s: number;
    m: number;
    l: number;
    xl: number;
    xxl: number;
  };
}

// Valeurs de typographie
export const typography: ThemeTypography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
  },
  fontSize: {
    xs: 12,
    s: 14,
    m: 16,
    l: 18,
    xl: 20,
    xxl: 24
  }
};

// Type pour le thème complet
export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  dark: boolean;
}

// Interface pour le contexte du thème
interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

// Création du contexte avec des valeurs par défaut
const ThemeContext = createContext<ThemeContextType>({
  theme: {
    colors: lightThemeColors,
    spacing,
    typography,
    dark: false
  },
  isDark: false,
  toggleTheme: () => {},
  setDarkMode: () => {}
});

// Props du provider
interface ThemeProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le contexte du thème
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Récupérer le schéma de couleurs du système
  const systemColorScheme = useColorScheme();
  
  // État local pour le mode sombre
  const [isDark, setIsDark] = useState<boolean>(systemColorScheme === 'dark');
  
  // Charger les préférences au démarrage
  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const preferences = await loadUserPreferences();
        // Si une préférence est enregistrée, l'utiliser
        if (preferences && preferences.darkMode !== undefined) {
          setIsDark(preferences.darkMode);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des préférences de thème:', error);
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Écouter les changements du schéma de couleurs système
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // Uniquement mettre à jour si l'utilisateur n'a pas défini de préférence
      const syncWithSystem = async () => {
        try {
          const preferences = await loadUserPreferences();
          if (preferences.darkMode === undefined) {
            setIsDark(colorScheme === 'dark');
          }
        } catch (error) {
          console.error('Erreur lors de la synchronisation avec le thème système:', error);
        }
      };
      
      syncWithSystem();
    });
    
    return () => {
      subscription.remove();
    };
  }, []);
  
  /**
   * Bascule entre les modes clair et sombre
   */
  const toggleTheme = async () => {
    try {
      const newDarkMode = !isDark;
      setIsDark(newDarkMode);
      await saveThemePreference(newDarkMode);
    } catch (error) {
      console.error('Erreur lors du changement de thème:', error);
    }
  };
  
  /**
   * Définit directement le mode (clair/sombre)
   */
  const setDarkMode = async (dark: boolean) => {
    try {
      setIsDark(dark);
      await saveThemePreference(dark);
    } catch (error) {
      console.error('Erreur lors de la définition du thème:', error);
    }
  };
  
  // Construire le thème en fonction du mode
  const theme: Theme = {
    colors: isDark ? darkThemeColors : lightThemeColors,
    spacing,
    typography,
    dark: isDark
  };
  
  // Valeur du contexte
  const value: ThemeContextType = {
    theme,
    isDark,
    toggleTheme,
    setDarkMode
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte du thème
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme doit être utilisé à l\'intérieur d\'un ThemeProvider');
  }
  
  return context;
};