/**
 * Hook personnalisé pour accéder au thème de l'application
 * Fournit des fonctions d'aide pour utiliser le thème courant
 */

import { useMemo } from 'react';
import { StyleSheet, TextStyle, ViewStyle, ImageStyle } from 'react-native';
import { useTheme as useThemeContext, Theme } from '../contexts/ThemeContext';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Hook pour accéder au thème et créer des styles dynamiques
 */
export const useTheme = () => {
  const { theme, isDark, toggleTheme, setDarkMode } = useThemeContext();
  
  /**
   * Crée des styles basés sur le thème actuel
   * @param stylesCallback - Fonction qui reçoit le thème et retourne des styles
   */
  const makeStyles = <T extends NamedStyles<T>>(
    stylesCallback: (theme: Theme) => T
  ): T => {
    // Mémoiser les styles pour éviter de les recréer à chaque rendu
    return useMemo(() => {
      const styles = stylesCallback(theme);
      return StyleSheet.create(styles);
    }, [theme]);
  };
  
  /**
   * Obtient une couleur du thème avec un niveau d'opacité
   * @param color - Nom de la couleur dans le thème
   * @param opacity - Niveau d'opacité (0-1)
   */
  const getColorWithOpacity = (color: keyof Theme['colors'], opacity: number): string => {
    // Convertir la couleur hex en rgba
    const hexColor = theme.colors[color];
    
    // Si la couleur est déjà au format rgba, ajuster l'opacité
    if (hexColor.startsWith('rgba')) {
      return hexColor.replace(/rgba\((\d+,\s*\d+,\s*\d+),[^)]+\)/, `rgba($1,${opacity})`);
    }
    
    // Si la couleur est au format hex
    if (hexColor.startsWith('#')) {
      const r = parseInt(hexColor.slice(1, 3), 16);
      const g = parseInt(hexColor.slice(3, 5), 16);
      const b = parseInt(hexColor.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
    // Fallback: retourner la couleur telle quelle
    return hexColor;
  };
  
  /**
   * Obtient un style de texte avec la couleur et la taille spécifiées
   */
  const getTextStyle = (
    color: keyof Theme['colors'] = 'text',
    size: keyof Theme['typography']['fontSize'] = 'm'
  ): TextStyle => {
    return {
      color: theme.colors[color],
      fontSize: theme.typography.fontSize[size],
      fontFamily: theme.typography.fontFamily.regular,
    };
  };
  
  /**
   * Obtient un style pour les ombres adapté à la plateforme
   */
  const getShadowStyle = (elevation: number = 3): ViewStyle => {
    if (isDark) {
      // Ombres plus subtiles en mode sombre
      return {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: elevation,
        elevation: elevation,
      };
    }
    
    return {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: Math.min(1, elevation / 3) },
      shadowOpacity: 0.2,
      shadowRadius: elevation / 2,
      elevation: elevation,
    };
  };
  
  /**
   * Obtient un style pour une carte (conteneur avec ombre et bord arrondi)
   */
  const getCardStyle = (elevated: boolean = true): ViewStyle => {
    return {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.s,
      padding: theme.spacing.m,
      ...(elevated ? getShadowStyle() : {}),
    };
  };
  
  /**
   * Obtient un style pour un bouton
   */
  const getButtonStyle = (
    variant: 'primary' | 'secondary' | 'outline' | 'text' = 'primary',
    size: 'small' | 'medium' | 'large' = 'medium',
    disabled: boolean = false
  ): ViewStyle => {
    // Définir les styles de base selon la taille
    let baseStyle: ViewStyle = {};
    
    switch (size) {
      case 'small':
        baseStyle = {
          paddingHorizontal: theme.spacing.m,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.spacing.xs,
        };
        break;
      case 'large':
        baseStyle = {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.m,
          borderRadius: theme.spacing.s,
        };
        break;
      default: // medium
        baseStyle = {
          paddingHorizontal: theme.spacing.l,
          paddingVertical: theme.spacing.s,
          borderRadius: theme.spacing.s,
        };
    }
    
    // Ajouter les styles selon la variante
    switch (variant) {
      case 'secondary':
        baseStyle = {
          ...baseStyle,
          backgroundColor: theme.colors.secondary,
        };
        break;
      case 'outline':
        baseStyle = {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: theme.colors.primary,
        };
        break;
      case 'text':
        baseStyle = {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
        break;
      default: // primary
        baseStyle = {
          ...baseStyle,
          backgroundColor: theme.colors.primary,
        };
    }
    
    // Ajouter les styles de désactivation si nécessaire
    if (disabled) {
      baseStyle = {
        ...baseStyle,
        opacity: 0.5,
      };
    }
    
    return baseStyle;
  };
  
  /**
   * Obtient un style pour un texte de bouton
   */
  const getButtonTextStyle = (
    variant: 'primary' | 'secondary' | 'outline' | 'text' = 'primary',
    size: 'small' | 'medium' | 'large' = 'medium'
  ): TextStyle => {
    // Couleur du texte selon la variante
    let color: keyof Theme['colors'] = 'textLight';
    
    switch (variant) {
      case 'outline':
      case 'text':
        color = 'primary';
        break;
      default:
        color = 'textLight';
    }
    
    // Taille du texte selon la taille du bouton
    let textSize: keyof Theme['typography']['fontSize'] = 'm';
    
    switch (size) {
      case 'small':
        textSize = 's';
        break;
      case 'large':
        textSize = 'l';
        break;
      default:
        textSize = 'm';
    }
    
    return {
      color: theme.colors[color],
      fontSize: theme.typography.fontSize[textSize],
      fontFamily: theme.typography.fontFamily.medium,
      textAlign: 'center',
    };
  };
  
  /**
   * Obtient un style pour un champ de saisie
   */
  const getInputStyle = (
    multiline: boolean = false,
    error: boolean = false
  ): ViewStyle & TextStyle => {
    return {
      backgroundColor: theme.colors.input,
      borderRadius: theme.spacing.xs,
      borderWidth: 1,
      borderColor: error ? theme.colors.error : theme.colors.border,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      color: theme.colors.text,
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.regular,
      minHeight: multiline ? 100 : 50,
    };
  };
  
  return {
    theme,
    isDark,
    toggleTheme,
    setDarkMode,
    makeStyles,
    getColorWithOpacity,
    getTextStyle,
    getShadowStyle,
    getCardStyle,
    getButtonStyle,
    getButtonTextStyle,
    getInputStyle,
  };
};