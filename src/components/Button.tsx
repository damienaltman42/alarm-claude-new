/**
 * Composant de bouton personnalisé
 */

import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  ViewStyle, 
  TextStyle, 
  StyleSheet 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: string; // Nom d'icône Ionicons
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle
}) => {
  const { theme, makeStyles } = useTheme();
  
  const styles = makeStyles((theme) => ({
    button: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: size === 'small' ? theme.spacing.xs : theme.spacing.s,
      paddingVertical: getPaddingVertical(size, theme),
      paddingHorizontal: getPaddingHorizontal(size, theme),
      backgroundColor: getBackgroundColor(variant, theme),
      borderWidth: variant === 'outline' ? 1 : 0,
      borderColor: variant === 'outline' ? theme.colors.primary : undefined,
      opacity: disabled ? 0.5 : 1,
    },
    text: {
      fontFamily: theme.typography.fontFamily.medium,
      fontSize: getFontSize(size, theme),
      color: getTextColor(variant, theme),
      textAlign: 'center',
    },
    icon: {
      marginRight: iconPosition === 'left' ? theme.spacing.s : 0,
      marginLeft: iconPosition === 'right' ? theme.spacing.s : 0,
    },
    loadingContainer: {
      marginRight: theme.spacing.s,
    }
  }));
  
  // Obtenir la couleur de fond en fonction de la variante
  function getBackgroundColor(variant: ButtonVariant, theme: any): string {
    switch (variant) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.secondary;
      case 'outline':
      case 'text':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  }
  
  // Obtenir la couleur du texte en fonction de la variante
  function getTextColor(variant: ButtonVariant, theme: any): string {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return theme.colors.textLight;
      case 'outline':
      case 'text':
        return theme.colors.primary;
      default:
        return theme.colors.textLight;
    }
  }
  
  // Obtenir la taille de police en fonction de la taille du bouton
  function getFontSize(size: ButtonSize, theme: any): number {
    switch (size) {
      case 'small':
        return theme.typography.fontSize.s;
      case 'large':
        return theme.typography.fontSize.l;
      default:
        return theme.typography.fontSize.m;
    }
  }
  
  // Obtenir le padding vertical en fonction de la taille du bouton
  function getPaddingVertical(size: ButtonSize, theme: any): number {
    switch (size) {
      case 'small':
        return theme.spacing.xs;
      case 'large':
        return theme.spacing.m;
      default:
        return theme.spacing.s;
    }
  }
  
  // Obtenir le padding horizontal en fonction de la taille du bouton
  function getPaddingHorizontal(size: ButtonSize, theme: any): number {
    switch (size) {
      case 'small':
        return theme.spacing.m;
      case 'large':
        return theme.spacing.xl;
      default:
        return theme.spacing.l;
    }
  }
  
  // Obtenir la taille de l'icône en fonction de la taille du bouton
  function getIconSize(size: ButtonSize): number {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  }
  
  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading && (
        <ActivityIndicator
          size="small"
          color={getTextColor(variant, theme)}
          style={styles.loadingContainer}
        />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <Ionicons
          name={icon as any}
          size={getIconSize(size)}
          color={getTextColor(variant, theme)}
          style={styles.icon}
        />
      )}
      
      <Text style={[styles.text, textStyle]}>
        {title}
      </Text>
      
      {!loading && icon && iconPosition === 'right' && (
        <Ionicons
          name={icon as any}
          size={getIconSize(size)}
          color={getTextColor(variant, theme)}
          style={styles.icon}
        />
      )}
    </TouchableOpacity>
  );
};

export default Button;