/**
 * Point d'entrée principal de l'application AuroraWake
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { enableScreens } from 'react-native-screens';

// Providers et contextes
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AlarmsProvider } from './src/contexts/AlarmsContext';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Services
import { initNotifications } from './src/services/alarmService';

// Activer l'optimisation des écrans pour React Navigation
enableScreens();

// Maintenir l'écran de démarrage visible pendant l'initialisation
SplashScreen.preventAutoHideAsync();

// Configurer les notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ignorer certains avertissements de la console (à ajuster selon les besoins)
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested inside plain ScrollViews',
]);

/**
 * Composant principal de l'application
 */
export default function App() {
  // Initialiser les notifications lors du démarrage
  useEffect(() => {
    const setupApp = async () => {
      try {
        // Initialiser les notifications
        await initNotifications();
        
        // Autres initialisations potentielles ici
        
        // Masquer l'écran de démarrage une fois l'initialisation terminée
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'application:', error);
        // Masquer l'écran de démarrage même en cas d'erreur
        await SplashScreen.hideAsync();
      }
    };
    
    setupApp();
  }, []);
  
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AlarmsProvider>
            <StatusBar />
            <AppNavigator />
          </AlarmsProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}