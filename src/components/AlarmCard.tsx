/**
 * Composant pour afficher une carte d'alarme
 * Affiche les détails d'une alarme et permet de l'activer/désactiver
 */

import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { AlarmInfo } from '../hooks/useAlarmsManager';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WakeUpMode } from '../types/alarm';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface AlarmCardProps {
  alarm: AlarmInfo;
  onToggle: (id: string, active: boolean) => void;
  isNext?: boolean;
}

const AlarmCard: React.FC<AlarmCardProps> = ({ 
  alarm, 
  onToggle,
  isNext = false 
}) => {
  const navigation = useNavigation<NavigationProp>();
  const { theme, makeStyles } = useTheme();
  const [isToggling, setIsToggling] = useState(false);
  
  const styles = makeStyles((theme) => ({
    container: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.m,
      marginVertical: theme.spacing.s,
      padding: theme.spacing.m,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      borderLeftWidth: isNext ? 4 : 0,
      borderLeftColor: isNext ? theme.colors.primary : 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.s,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    time: {
      fontSize: theme.typography.fontSize.xxl,
      fontFamily: theme.typography.fontFamily.bold,
      color: alarm.active ? theme.colors.text : theme.colors.textSecondary,
    },
    name: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.medium,
      color: alarm.active ? theme.colors.textSecondary : theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    details: {
      marginTop: theme.spacing.s,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: theme.spacing.xs / 2,
    },
    icon: {
      marginRight: theme.spacing.s,
      width: 20,
      alignItems: 'center',
    },
    text: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      flex: 1,
    },
    nextInfo: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.primary,
      marginTop: theme.spacing.xs,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.m,
      paddingTop: theme.spacing.s,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.s,
      borderRadius: theme.spacing.s,
    },
    editText: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.primary,
      marginLeft: theme.spacing.xs,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    inactiveText: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.error,
      marginRight: theme.spacing.s,
    },
    switch: {
      transform: Platform.OS === 'ios' ? [{ scale: 0.8 }] : [{ scale: 1 }],
    },
    typeTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: getModeColor(alarm.mode, theme, 0.1),
      paddingHorizontal: theme.spacing.s,
      paddingVertical: theme.spacing.xs / 2,
      borderRadius: theme.spacing.m,
      alignSelf: 'flex-start',
      marginTop: theme.spacing.xs,
    },
    typeText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      color: getModeColor(alarm.mode, theme),
      marginLeft: theme.spacing.xs / 2,
    },
  }));
  
  // Gérer la navigation vers l'écran d'édition
  const handleEditPress = () => {
    navigation.navigate('EditAlarm', { alarmId: alarm.id });
  };
  
  // Gérer l'activation/désactivation de l'alarme
  const handleToggle = (value: boolean) => {
    setIsToggling(true);
    onToggle(alarm.id, value);
    
    // Ajouter un petit délai pour l'animation
    setTimeout(() => {
      setIsToggling(false);
    }, 500);
  };
  
  // Obtenir l'icône correspondant au mode de réveil
  const getModeIcon = (mode: WakeUpMode) => {
    switch (mode) {
      case WakeUpMode.Radio:
        return 'radio-outline';
      case WakeUpMode.Spotify:
        return 'musical-notes-outline';
      case WakeUpMode.Horoscope:
        return 'star-outline';
      default:
        return 'help-circle-outline';
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <View style={styles.timeContainer}>
            <Text style={styles.time}>{alarm.timeFormatted}</Text>
          </View>
          
          <Text style={styles.name}>{alarm.name}</Text>
          
          <View style={styles.typeTag}>
            <Ionicons 
              name={getModeIcon(alarm.mode)} 
              size={12} 
              color={getModeColor(alarm.mode, theme)} 
            />
            <Text style={styles.typeText}>{alarm.modeName}</Text>
          </View>
        </View>
        
        <Switch
          style={styles.switch}
          value={alarm.active}
          onValueChange={handleToggle}
          disabled={isToggling}
          trackColor={{ 
            false: theme.colors.border, 
            true: `${theme.colors.primary}80` 
          }}
          thumbColor={
            alarm.active 
              ? theme.colors.primary 
              : Platform.OS === 'ios' 
                ? 'white' 
                : theme.colors.textSecondary
          }
          ios_backgroundColor={theme.colors.border}
        />
      </View>
      
      <View style={styles.details}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <Ionicons 
              name="repeat-outline" 
              size={16} 
              color={theme.colors.textSecondary} 
            />
          </View>
          <Text style={styles.text}>{alarm.repeatDaysFormatted}</Text>
        </View>
        
        <View style={styles.row}>
          <View style={styles.icon}>
            <Ionicons 
              name={getModeIcon(alarm.mode)} 
              size={16} 
              color={theme.colors.textSecondary} 
            />
          </View>
          <Text style={styles.text}>
            {alarm.modeDetail || alarm.modeName}
          </Text>
        </View>
        
        {alarm.active && alarm.nextAlarmDate && (
          <View style={styles.row}>
            <View style={styles.icon}>
              <Ionicons 
                name="calendar-outline" 
                size={16} 
                color={theme.colors.textSecondary} 
              />
            </View>
            <Text style={styles.text}>
              {alarm.nextAlarmDate} {alarm.timeRemaining ? `(${alarm.timeRemaining})` : ''}
            </Text>
          </View>
        )}
        
        {isNext && alarm.active && (
          <Text style={styles.nextInfo}>
            Prochaine alarme à sonner
          </Text>
        )}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          onPress={handleEditPress}
          style={styles.editButton}
        >
          <Ionicons 
            name="pencil-outline" 
            size={16} 
            color={theme.colors.primary} 
          />
          <Text style={styles.editText}>Modifier</Text>
        </TouchableOpacity>
        
        {!alarm.active && (
          <View style={styles.switchContainer}>
            <Text style={styles.inactiveText}>Désactivée</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// Fonction utilitaire pour obtenir la couleur correspondant au mode
function getModeColor(mode: WakeUpMode, theme: any, alpha: number = 1) {
  switch (mode) {
    case WakeUpMode.Radio:
      return alpha === 1 
        ? theme.colors.info 
        : `${theme.colors.info}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    case WakeUpMode.Spotify:
      return alpha === 1 
        ? '#1DB954' // Couleur Spotify
        : `#1DB954${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    case WakeUpMode.Horoscope:
      return alpha === 1 
        ? theme.colors.secondary 
        : `${theme.colors.secondary}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
    default:
      return alpha === 1 
        ? theme.colors.primary 
        : `${theme.colors.primary}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }
}

export default AlarmCard;