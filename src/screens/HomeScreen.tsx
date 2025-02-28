/**
 * Écran principal affichant la liste des alarmes
 */

import React, { useCallback, useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';

import AlarmsList from '../components/AlarmsList';
import { useAlarmsManager } from '../hooks/useAlarmsManager';
import { useTheme } from '../hooks/useTheme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { TimeFormat } from '../utils/constants';

type NavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { theme, makeStyles } = useTheme();
  
  const { 
    alarms,
    loading, 
    error, 
    nextAlarm,
    toggleAlarmState, 
    refreshAlarms,
    getFormattedAlarms
  } = useAlarmsManager();
  
  // État local
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(TimeFormat.Format24h);
  const [formattedAlarms, setFormattedAlarms] = useState(getFormattedAlarms(timeFormat));
  
  // Mettre à jour les alarmes formatées quand les alarmes changent
  useEffect(() => {
    setFormattedAlarms(getFormattedAlarms(timeFormat));
  }, [alarms, timeFormat, getFormattedAlarms]);
  
  const styles = makeStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    fab: {
      position: 'absolute',
      right: theme.spacing.l,
      bottom: theme.spacing.xl,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      zIndex: 1,
    },
  }));
  
  // Naviguer vers l'écran d'ajout d'alarme
  const handleAddAlarm = useCallback(() => {
    navigation.navigate('AddAlarm');
  }, [navigation]);
  
  // Activer/désactiver une alarme
  const handleToggleAlarm = useCallback(
    async (id: string, active: boolean) => {
      await toggleAlarmState(id, active);
    },
    [toggleAlarmState]
  );
  
  // Actualiser la liste des alarmes
  const handleRefresh = useCallback(() => {
    refreshAlarms();
  }, [refreshAlarms]);
  
  return (
    <View style={styles.container}>
      <AlarmsList
        alarms={formattedAlarms}
        loading={loading}
        onToggleAlarm={handleToggleAlarm}
        onRefresh={handleRefresh}
        nextAlarmId={nextAlarm?.id}
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddAlarm}
        activeOpacity={0.8}
      >
        <Ionicons
          name="add"
          size={32}
          color={theme.colors.textLight}
        />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;