/**
 * Composant pour sélectionner les jours de répétition d'une alarme
 */

import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';

import { WeekDay } from '../types/alarm';
import { WEEKDAY_SHORT_NAMES } from '../utils/constants';
import { useTheme } from '../hooks/useTheme';

interface DaySelectorProps {
  selectedDays: WeekDay[];
  onDayPress: (day: WeekDay) => void;
}

const DaySelector: React.FC<DaySelectorProps> = ({ 
  selectedDays, 
  onDayPress 
}) => {
  const { theme, makeStyles } = useTheme();
  
  const styles = makeStyles((theme) => ({
    container: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginVertical: theme.spacing.m,
    },
    dayButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.input,
    },
    dayButtonSelected: {
      backgroundColor: theme.colors.primary,
    },
    dayText: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
    },
    dayTextSelected: {
      color: theme.colors.textLight,
    },
    shortcutsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.s,
    },
    shortcutButton: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.xs,
      borderRadius: theme.spacing.s,
      backgroundColor: theme.colors.input,
    },
    shortcutText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
  }));
  
  // Jours de la semaine (0 = Lundi, 1 = Mardi, ..., 6 = Dimanche)
  const weekDays = [
    WeekDay.Monday,
    WeekDay.Tuesday,
    WeekDay.Wednesday,
    WeekDay.Thursday,
    WeekDay.Friday,
    WeekDay.Saturday,
    WeekDay.Sunday,
  ];
  
  // Gérer la sélection d'un jour
  const handleDayPress = (day: WeekDay) => {
    onDayPress(day);
  };
  
  // Gérer les raccourcis de sélection
  const handleSelectAll = () => {
    if (selectedDays.length === 7) {
      // Tout désélectionner si tous sont déjà sélectionnés
      weekDays.forEach(day => {
        if (selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
    } else {
      // Sélectionner tous les jours
      weekDays.forEach(day => {
        if (!selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
    }
  };
  
  const handleSelectWeekdays = () => {
    const weekdays = [
      WeekDay.Monday,
      WeekDay.Tuesday,
      WeekDay.Wednesday,
      WeekDay.Thursday,
      WeekDay.Friday,
    ];
    
    // Vérifier si tous les jours ouvrés sont déjà sélectionnés
    const allWeekdaysSelected = weekdays.every(day => selectedDays.includes(day));
    
    if (allWeekdaysSelected) {
      // Désélectionner tous les jours ouvrés
      weekdays.forEach(day => {
        if (selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
    } else {
      // Sélectionner tous les jours ouvrés
      weekdays.forEach(day => {
        if (!selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
      
      // Désélectionner le week-end
      [WeekDay.Saturday, WeekDay.Sunday].forEach(day => {
        if (selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
    }
  };
  
  const handleSelectWeekend = () => {
    const weekend = [WeekDay.Saturday, WeekDay.Sunday];
    
    // Vérifier si tout le week-end est déjà sélectionné
    const allWeekendSelected = weekend.every(day => selectedDays.includes(day));
    
    if (allWeekendSelected) {
      // Désélectionner tout le week-end
      weekend.forEach(day => {
        if (selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
    } else {
      // Sélectionner tout le week-end
      weekend.forEach(day => {
        if (!selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
      
      // Désélectionner les jours ouvrés
      [
        WeekDay.Monday,
        WeekDay.Tuesday,
        WeekDay.Wednesday,
        WeekDay.Thursday,
        WeekDay.Friday,
      ].forEach(day => {
        if (selectedDays.includes(day)) {
          onDayPress(day);
        }
      });
    }
  };
  
  return (
    <View>
      <View style={styles.container}>
        {weekDays.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.dayButton,
              selectedDays.includes(day) && styles.dayButtonSelected,
            ]}
            onPress={() => handleDayPress(day)}
          >
            <Text
              style={[
                styles.dayText,
                selectedDays.includes(day) && styles.dayTextSelected,
              ]}
            >
              {WEEKDAY_SHORT_NAMES[day].charAt(0)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.shortcutsContainer}>
        <TouchableOpacity
          style={styles.shortcutButton}
          onPress={handleSelectAll}
        >
          <Text style={styles.shortcutText}>
            {selectedDays.length === 7 ? 'Aucun' : 'Tous les jours'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.shortcutButton}
          onPress={handleSelectWeekdays}
        >
          <Text style={styles.shortcutText}>Jours ouvrés</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.shortcutButton}
          onPress={handleSelectWeekend}
        >
          <Text style={styles.shortcutText}>Week-end</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default DaySelector;