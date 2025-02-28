/**
 * Navigateur principal de l'application
 * Configure les différentes routes et la navigation
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Hooks et contextes
import { useTheme } from '../hooks/useTheme';
import { useAlarms } from '../contexts/AlarmsContext';

// Écrans
import HomeScreen from '../screens/HomeScreen';
import AddAlarmScreen from '../screens/AddAlarmScreen';
import EditAlarmScreen from '../screens/EditAlarmScreen';
import AlarmRingingScreen from '../screens/AlarmRingingScreen';
import SettingsScreen from '../screens/SettingsScreen';

// Types pour les paramètres de navigation
export type RootStackParamList = {
  Main: undefined;
  AddAlarm: undefined;
  EditAlarm: { alarmId: string };
  AlarmRinging: { alarmId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Settings: undefined;
};

// Créer les navigateurs
const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Navigateur d'onglets principal
 */
const MainTabNavigator: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          if (route.name === 'Home') {
            iconName = focused ? 'alarm' : 'alarm-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
          paddingBottom: Platform.OS === 'ios' ? 10 : 5,
          height: Platform.OS === 'ios' ? 85 : 60,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fontFamily.medium,
          fontSize: 12,
          marginBottom: Platform.OS === 'ios' ? 0 : 5,
        },
        headerStyle: {
          backgroundColor: theme.colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.border,
        },
        headerTitleStyle: {
          fontFamily: theme.typography.fontFamily.bold,
          fontSize: theme.typography.fontSize.l,
          color: theme.colors.text,
        },
        headerTintColor: theme.colors.primary,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Alarmes' }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ title: 'Paramètres' }}
      />
    </Tab.Navigator>
  );
};

/**
 * Navigateur principal de l'application
 */
const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const { alarms } = useAlarms();
  const [isRinging, setIsRinging] = useState(false);
  const [ringingAlarmId, setRingingAlarmId] = useState<string | null>(null);

  // Surveiller si une alarme est en train de sonner
  useEffect(() => {
    const checkRingingAlarms = () => {
      const now = new Date();
      
      // Chercher une alarme qui devrait sonner maintenant
      const ringingAlarm = alarms.find(alarm => {
        if (!alarm.active || !alarm.nextRingTime) return false;
        
        const diffMs = Math.abs(alarm.nextRingTime.getTime() - now.getTime());
        // Considérer qu'une alarme doit sonner si on est à moins de 60 secondes de l'heure prévue
        return diffMs < 60 * 1000;
      });
      
      if (ringingAlarm) {
        setRingingAlarmId(ringingAlarm.id);
        setIsRinging(true);
      } else {
        setIsRinging(false);
        setRingingAlarmId(null);
      }
    };
    
    // Vérifier toutes les 15 secondes
    const interval = setInterval(checkRingingAlarms, 15000);
    
    // Vérifier immédiatement au démarrage
    checkRingingAlarms();
    
    return () => clearInterval(interval);
  }, [alarms]);
  
  // Personnaliser le thème de navigation en fonction du thème de l'application
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.card,
      text: theme.colors.text,
      border: theme.colors.border,
      notification: theme.colors.primary,
    },
  };
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.background}
      />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        {isRinging && ringingAlarmId ? (
          // Si une alarme sonne, afficher l'écran d'alarme active
          <Stack.Screen 
            name="AlarmRinging" 
            component={AlarmRingingScreen} 
            initialParams={{ alarmId: ringingAlarmId }}
          />
        ) : (
          // Sinon, afficher la navigation normale
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen 
              name="AddAlarm" 
              component={AddAlarmScreen}
              options={{
                headerShown: true,
                title: 'Nouvelle alarme',
                headerStyle: {
                  backgroundColor: theme.colors.card,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                },
                headerTitleStyle: {
                  fontFamily: theme.typography.fontFamily.bold,
                  fontSize: theme.typography.fontSize.l,
                  color: theme.colors.text,
                },
                headerTintColor: theme.colors.primary,
              }}
            />
            <Stack.Screen 
              name="EditAlarm" 
              component={EditAlarmScreen}
              options={{
                headerShown: true,
                title: 'Modifier l\'alarme',
                headerStyle: {
                  backgroundColor: theme.colors.card,
                  elevation: 0,
                  shadowOpacity: 0,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                },
                headerTitleStyle: {
                  fontFamily: theme.typography.fontFamily.bold,
                  fontSize: theme.typography.fontSize.l,
                  color: theme.colors.text,
                },
                headerTintColor: theme.colors.primary,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;