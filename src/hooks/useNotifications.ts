/**
 * Hook personnalisé pour la gestion des notifications
 * S'occupe des permissions et de l'affichage des notifications
 */

import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { ALARM_NOTIFICATION_CHANNEL_ID } from '../utils/constants';

interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}

/**
 * Hook pour gérer les notifications
 */
export const useNotifications = () => {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    granted: false,
    canAskAgain: true,
    status: Notifications.PermissionStatus.UNDETERMINED
  });
  
  const [notificationListener, setNotificationListener] = useState<Notifications.Subscription | null>(null);
  const [responseListener, setResponseListener] = useState<Notifications.Subscription | null>(null);
  
  // Configurer les notifications au démarrage
  useEffect(() => {
    configureNotifications();
    checkPermissions();
    
    // Configurer les listeners pour les notifications
    const notifListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });
    
    const respListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Réponse à la notification reçue:', response);
      
      // Ici, on pourrait naviguer vers l'écran approprié en fonction de la notification
      // Exemple: si c'est une alarme, naviguer vers l'écran d'alarme active
      
      const data = response.notification.request.content.data;
      if (data && data.alarmId) {
        // Traitement spécifique pour les alarmes
        // On pourrait utiliser un système d'événements pour informer l'application
      }
    });
    
    setNotificationListener(notifListener);
    setResponseListener(respListener);
    
    // Nettoyage à la fermeture
    return () => {
      if (notificationListener) {
        Notifications.removeNotificationSubscription(notificationListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }, []);
  
  /**
   * Configure les notifications pour l'application
   */
  const configureNotifications = useCallback(async () => {
    // Configurer le gestionnaire de notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    
    // Créer le channel de notification pour Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(ALARM_NOTIFICATION_CHANNEL_ID, {
        name: 'AuroraWake Alarmes',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6b7fff',
        sound: true,
        enableVibrate: true,
      });
    }
  }, []);
  
  /**
   * Vérifie et demande les permissions de notification
   */
  const checkPermissions = useCallback(async () => {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    // Si nous n'avons pas encore de permissions, les demander
    if (existingStatus !== Notifications.PermissionStatus.GRANTED) {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    setPermissions({
      granted: finalStatus === Notifications.PermissionStatus.GRANTED,
      canAskAgain: existingStatus !== Notifications.PermissionStatus.DENIED,
      status: finalStatus
    });
    
    return finalStatus === Notifications.PermissionStatus.GRANTED;
  }, []);
  
  /**
   * Envoie une notification immédiate
   */
  const sendImmediateNotification = useCallback(async (
    title: string,
    body: string,
    data: Record<string, any> = {}
  ) => {
    if (!permissions.granted) {
      const granted = await checkPermissions();
      if (!granted) {
        console.error('Permissions de notification non accordées');
        return null;
      }
    }
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: null, // Déclencher immédiatement
      });
      
      return notificationId;
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification:', error);
      return null;
    }
  }, [permissions, checkPermissions]);
  
  /**
   * Programme une notification pour une date future
   */
  const scheduleNotification = useCallback(async (
    title: string,
    body: string,
    date: Date,
    data: Record<string, any> = {}
  ) => {
    if (!permissions.granted) {
      const granted = await checkPermissions();
      if (!granted) {
        console.error('Permissions de notification non accordées');
        return null;
      }
    }
    
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: true,
        },
        trigger: {
          date,
        },
      });
      
      return notificationId;
    } catch (error) {
      console.error('Erreur lors de la programmation de la notification:', error);
      return null;
    }
  }, [permissions, checkPermissions]);
  
  /**
   * Annule une notification programmée
   */
  const cancelNotification = useCallback(async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      return true;
    } catch (error) {
      console.error('Erreur lors de l\'annulation de la notification:', error);
      return false;
    }
  }, []);
  
  /**
   * Récupère toutes les notifications programmées
   */
  const getScheduledNotifications = useCallback(async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications programmées:', error);
      return [];
    }
  }, []);
  
  /**
   * Supprime toutes les notifications
   */
  const cancelAllNotifications = useCallback(async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return true;
    } catch (error) {
      console.error('Erreur lors de la suppression de toutes les notifications:', error);
      return false;
    }
  }, []);
  
  /**
   * Vérifie si les services de notification sont disponibles
   */
  const areNotificationsAvailable = useCallback(() => {
    return permissions.granted;
  }, [permissions]);
  
  return {
    permissions,
    checkPermissions,
    sendImmediateNotification,
    scheduleNotification,
    cancelNotification,
    getScheduledNotifications,
    cancelAllNotifications,
    areNotificationsAvailable
  };
};