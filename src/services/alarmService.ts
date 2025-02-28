/**
 * Service pour la gestion des alarmes et notifications
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Alarm, AlarmEvent, WakeUpMode } from '../types/alarm';
import { generateAlarmId, calculateNextRingTime } from '../utils/alarmUtils';
import { loadAlarms, saveAlarms } from './storageService';
import { ALARM_NOTIFICATION_CHANNEL_ID, PRE_ALARM_NOTIFICATION_SECONDS, SNOOZE_DURATION_MINUTES } from '../utils/constants';

// Configuration des notifications pour les alarmes
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Initialise le service de notification pour les alarmes
 * Crée le channel de notification sur Android
 */
export const initNotifications = async (): Promise<void> => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ALARM_NOTIFICATION_CHANNEL_ID, {
      name: 'AuroraWake Alarmes',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6b7fff',
      sound: true,
    });
  }
};

/**
 * Vérifie et demande les permissions de notification
 * 
 * @returns Objet avec le statut des permissions
 */
export const checkNotificationPermissions = async (): Promise<Notifications.PermissionResponse> => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  
  // Si nous avons déjà les permissions, on les retourne
  if (existingStatus === 'granted') {
    return { status: existingStatus, granted: existingStatus === 'granted', canAskAgain: true };
  }
  
  // Sinon, on les demande
  return await Notifications.requestPermissionsAsync();
};

/**
 * Programme une notification pour une alarme
 * 
 * @param alarm - L'alarme à programmer
 * @returns L'ID de la notification programmée
 */
export const scheduleAlarmNotification = async (alarm: Alarm): Promise<string | null> => {
  if (!alarm.active || !alarm.nextRingTime) {
    return null;
  }
  
  // Vérifier les permissions
  const { status } = await checkNotificationPermissions();
  if (status !== 'granted') {
    console.error('Permissions de notification non accordées');
    return null;
  }
  
  // Annuler toute notification existante pour cette alarme
  if (alarm.notificationId) {
    await Notifications.cancelScheduledNotificationAsync(alarm.notificationId);
  }
  
  // Préparer les détails de la notification selon le mode de réveil
  const title = alarm.name || 'Réveil AuroraWake';
  let body = '';
  let data: any = { alarmId: alarm.id };
  
  switch (alarm.wakeUpSettings.type) {
    case WakeUpMode.Radio:
      body = `Réveil Radio: ${(alarm.wakeUpSettings as any).stationName}`;
      data.mode = WakeUpMode.Radio;
      data.stationUrl = (alarm.wakeUpSettings as any).stationUrl;
      break;
    case WakeUpMode.Spotify:
      body = `Réveil Spotify: ${(alarm.wakeUpSettings as any).playlistName || (alarm.wakeUpSettings as any).trackName || 'Musique'}`;
      data.mode = WakeUpMode.Spotify;
      data.playlistId = (alarm.wakeUpSettings as any).playlistId;
      data.trackId = (alarm.wakeUpSettings as any).trackId;
      break;
    case WakeUpMode.Horoscope:
      body = `Réveil Horoscope: Découvrez votre horoscope du jour`;
      data.mode = WakeUpMode.Horoscope;
      data.zodiacSign = (alarm.wakeUpSettings as any).zodiacSign;
      data.soundId = (alarm.wakeUpSettings as any).soundId;
      break;
    default:
      body = 'Il est temps de se réveiller !';
  }
  
  try {
    // Calculer le temps de déclenchement en secondes avant l'heure de l'alarme
    // pour assurer que l'application a le temps de se préparer
    const triggerDate = new Date(alarm.nextRingTime);
    triggerDate.setSeconds(triggerDate.getSeconds() - PRE_ALARM_NOTIFICATION_SECONDS);
    
    // Programmer la notification
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
      },
      trigger: {
        date: triggerDate,
      },
    });
    
    return notificationId;
  } catch (error) {
    console.error('Erreur lors de la programmation de la notification:', error);
    return null;
  }
};

/**
 * Annule une notification d'alarme programmée
 * 
 * @param notificationId - ID de la notification à annuler
 */
export const cancelAlarmNotification = async (notificationId: string): Promise<void> => {
  if (!notificationId) return;
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Erreur lors de l\'annulation de la notification:', error);
  }
};

/**
 * Met à jour les notifications pour toutes les alarmes actives
 * 
 * @param alarms - Liste des alarmes à mettre à jour
 * @returns Liste des alarmes avec les IDs de notification mis à jour
 */
export const updateAllAlarmNotifications = async (alarms: Alarm[]): Promise<Alarm[]> => {
  const updatedAlarms = [];
  
  for (const alarm of alarms) {
    // On recalcule la prochaine heure de sonnerie
    const nextRingTime = calculateNextRingTime(alarm);
    const updatedAlarm = { ...alarm, nextRingTime };
    
    // Si l'alarme est active et a une prochaine heure de sonnerie, on programme la notification
    if (updatedAlarm.active && updatedAlarm.nextRingTime) {
      const notificationId = await scheduleAlarmNotification(updatedAlarm);
      updatedAlarm.notificationId = notificationId || undefined;
    } else if (updatedAlarm.notificationId) {
      // Si l'alarme n'est plus active ou n'a pas de prochaine sonnerie, on annule la notification
      await cancelAlarmNotification(updatedAlarm.notificationId);
      updatedAlarm.notificationId = undefined;
    }
    
    updatedAlarms.push(updatedAlarm);
  }
  
  return updatedAlarms;
};

/**
 * Ajoute une nouvelle alarme
 * 
 * @param newAlarmData - Données de la nouvelle alarme (sans id)
 * @returns Liste mise à jour des alarmes
 */
export const addAlarm = async (newAlarmData: Omit<Alarm, 'id' | 'nextRingTime' | 'notificationId'>): Promise<Alarm[]> => {
  // Générer un ID unique pour la nouvelle alarme
  const id = generateAlarmId();
  
  // Créer la nouvelle alarme avec l'ID et calculer la prochaine sonnerie
  const newAlarm: Alarm = {
    ...newAlarmData,
    id,
    nextRingTime: null,
  };
  
  newAlarm.nextRingTime = calculateNextRingTime(newAlarm);
  
  // Récupérer les alarmes existantes et ajouter la nouvelle
  const existingAlarms = await loadAlarms();
  const updatedAlarms = [...existingAlarms, newAlarm];
  
  // Programmer la notification pour la nouvelle alarme
  if (newAlarm.active && newAlarm.nextRingTime) {
    const notificationId = await scheduleAlarmNotification(newAlarm);
    newAlarm.notificationId = notificationId || undefined;
  }
  
  // Sauvegarder la liste mise à jour
  await saveAlarms(updatedAlarms);
  
  return updatedAlarms;
};

/**
 * Met à jour une alarme existante
 * 
 * @param updatedAlarm - Alarme mise à jour
 * @returns Liste mise à jour des alarmes
 */
export const updateAlarm = async (updatedAlarm: Alarm): Promise<Alarm[]> => {
  // Récupérer les alarmes existantes
  const existingAlarms = await loadAlarms();
  
  // Vérifier si l'alarme existe
  const alarmIndex = existingAlarms.findIndex(alarm => alarm.id === updatedAlarm.id);
  if (alarmIndex === -1) {
    throw new Error(`Alarme avec l'ID ${updatedAlarm.id} non trouvée`);
  }
  
  // Récupérer l'ancienne alarme pour pouvoir annuler sa notification
  const oldAlarm = existingAlarms[alarmIndex];
  if (oldAlarm.notificationId) {
    await cancelAlarmNotification(oldAlarm.notificationId);
  }
  
  // Mettre à jour la prochaine sonnerie
  updatedAlarm.nextRingTime = calculateNextRingTime(updatedAlarm);
  
  // Programmer une nouvelle notification si nécessaire
  if (updatedAlarm.active && updatedAlarm.nextRingTime) {
    const notificationId = await scheduleAlarmNotification(updatedAlarm);
    updatedAlarm.notificationId = notificationId || undefined;
  } else {
    updatedAlarm.notificationId = undefined;
  }
  
  // Mettre à jour la liste des alarmes
  const updatedAlarms = [...existingAlarms];
  updatedAlarms[alarmIndex] = updatedAlarm;
  
  // Sauvegarder la liste mise à jour
  await saveAlarms(updatedAlarms);
  
  return updatedAlarms;
};

/**
 * Supprime une alarme
 * 
 * @param alarmId - ID de l'alarme à supprimer
 * @returns Liste mise à jour des alarmes
 */
export const deleteAlarm = async (alarmId: string): Promise<Alarm[]> => {
  // Récupérer les alarmes existantes
  const existingAlarms = await loadAlarms();
  
  // Trouver l'alarme à supprimer
  const alarmToDelete = existingAlarms.find(alarm => alarm.id === alarmId);
  if (!alarmToDelete) {
    return existingAlarms; // L'alarme n'existe pas, on retourne la liste inchangée
  }
  
  // Annuler la notification si elle existe
  if (alarmToDelete.notificationId) {
    await cancelAlarmNotification(alarmToDelete.notificationId);
  }
  
  // Filtrer l'alarme supprimée
  const updatedAlarms = existingAlarms.filter(alarm => alarm.id !== alarmId);
  
  // Sauvegarder la liste mise à jour
  await saveAlarms(updatedAlarms);
  
  return updatedAlarms;
};

/**
 * Active ou désactive une alarme
 * 
 * @param alarmId - ID de l'alarme à activer/désactiver
 * @param active - État d'activation souhaité
 * @returns Liste mise à jour des alarmes
 */
export const toggleAlarm = async (alarmId: string, active: boolean): Promise<Alarm[]> => {
  // Récupérer les alarmes existantes
  const existingAlarms = await loadAlarms();
  
  // Trouver l'alarme à modifier
  const alarmIndex = existingAlarms.findIndex(alarm => alarm.id === alarmId);
  if (alarmIndex === -1) {
    throw new Error(`Alarme avec l'ID ${alarmId} non trouvée`);
  }
  
  // Copier l'alarme et mettre à jour son état d'activation
  const updatedAlarm = { ...existingAlarms[alarmIndex], active };
  
  // Gérer la notification selon l'état d'activation
  if (updatedAlarm.notificationId) {
    await cancelAlarmNotification(updatedAlarm.notificationId);
    updatedAlarm.notificationId = undefined;
  }
  
  // Mettre à jour la prochaine sonnerie
  updatedAlarm.nextRingTime = calculateNextRingTime(updatedAlarm);
  
  // Programmer une nouvelle notification si l'alarme est activée
  if (active && updatedAlarm.nextRingTime) {
    const notificationId = await scheduleAlarmNotification(updatedAlarm);
    updatedAlarm.notificationId = notificationId || undefined;
  }
  
  // Mettre à jour la liste des alarmes
  const updatedAlarms = [...existingAlarms];
  updatedAlarms[alarmIndex] = updatedAlarm;
  
  // Sauvegarder la liste mise à jour
  await saveAlarms(updatedAlarms);
  
  return updatedAlarms;
};

/**
 * Repousse une alarme (snooze)
 * 
 * @param alarmId - ID de l'alarme à repousser
 * @param snoozeDurationMinutes - Durée du snooze en minutes (par défaut SNOOZE_DURATION_MINUTES)
 * @returns Alarme mise à jour avec la nouvelle heure de sonnerie
 */
export const snoozeAlarm = async (
  alarmId: string, 
  snoozeDurationMinutes: number = SNOOZE_DURATION_MINUTES
): Promise<Alarm | null> => {
  // Récupérer les alarmes existantes
  const existingAlarms = await loadAlarms();
  
  // Trouver l'alarme à repousser
  const alarmIndex = existingAlarms.findIndex(alarm => alarm.id === alarmId);
  if (alarmIndex === -1) {
    return null;
  }
  
  const alarm = existingAlarms[alarmIndex];
  
  // Annuler la notification actuelle
  if (alarm.notificationId) {
    await cancelAlarmNotification(alarm.notificationId);
  }
  
  // Créer une nouvelle date de sonnerie (maintenant + durée du snooze)
  const now = new Date();
  const nextRingTime = new Date(now.getTime() + snoozeDurationMinutes * 60 * 1000);
  
  // Mettre à jour l'alarme avec la nouvelle heure de sonnerie
  const updatedAlarm = { ...alarm, nextRingTime };
  
  // Programmer la nouvelle notification
  const notificationId = await scheduleAlarmNotification(updatedAlarm);
  updatedAlarm.notificationId = notificationId || undefined;
  
  // Mettre à jour la liste des alarmes
  const updatedAlarms = [...existingAlarms];
  updatedAlarms[alarmIndex] = updatedAlarm;
  
  // Sauvegarder la liste mise à jour
  await saveAlarms(updatedAlarms);
  
  return updatedAlarm;
};

/**
 * Arrête une alarme qui sonne et reprogramme sa prochaine occurrence si elle est répétitive
 * 
 * @param alarmId - ID de l'alarme à arrêter
 * @returns Liste mise à jour des alarmes
 */
export const dismissAlarm = async (alarmId: string): Promise<Alarm[]> => {
  // Récupérer les alarmes existantes
  const existingAlarms = await loadAlarms();
  
  // Trouver l'alarme à arrêter
  const alarmIndex = existingAlarms.findIndex(alarm => alarm.id === alarmId);
  if (alarmIndex === -1) {
    return existingAlarms;
  }
  
  const alarm = existingAlarms[alarmIndex];
  
  // Annuler la notification actuelle
  if (alarm.notificationId) {
    await cancelAlarmNotification(alarm.notificationId);
  }
  
  // Créer une copie de l'alarme pour la mettre à jour
  const updatedAlarm = { ...alarm, notificationId: undefined };
  
  // Si l'alarme est répétitive, calculer sa prochaine occurrence
  if (updatedAlarm.repeatDays.length > 0) {
    updatedAlarm.nextRingTime = calculateNextRingTime(updatedAlarm);
    
    // Programmer la notification pour la prochaine occurrence
    if (updatedAlarm.active && updatedAlarm.nextRingTime) {
      const notificationId = await scheduleAlarmNotification(updatedAlarm);
      updatedAlarm.notificationId = notificationId || undefined;
    }
  } else {
    // Si c'est une alarme ponctuelle, la désactiver
    updatedAlarm.active = false;
    updatedAlarm.nextRingTime = null;
  }
  
  // Mettre à jour la liste des alarmes
  const updatedAlarms = [...existingAlarms];
  updatedAlarms[alarmIndex] = updatedAlarm;
  
  // Sauvegarder la liste mise à jour
  await saveAlarms(updatedAlarms);
  
  return updatedAlarms;
};

/**
 * Configure le listener pour les notifications d'alarme reçues
 * 
 * @param callback - Fonction à appeler lorsqu'une notification d'alarme est reçue
 * @returns Fonction pour retirer le listener
 */
export const setupAlarmNotificationListener = (
  callback: (alarm: Alarm, event: AlarmEvent) => void
): (() => void) => {
  // Configurer le listener pour les notifications reçues
  const subscription = Notifications.addNotificationReceivedListener(async notification => {
    const data = notification.request.content.data;
    const alarmId = data.alarmId as string;
    
    if (!alarmId) return;
    
    // Récupérer les alarmes existantes
    const alarms = await loadAlarms();
    const alarm = alarms.find(a => a.id === alarmId);
    
    if (alarm) {
      // Appeler le callback avec l'alarme et l'événement déclenché
      callback(alarm, AlarmEvent.Triggered);
    }
  });
  
  // Retourner une fonction pour retirer le listener
  return () => {
    subscription.remove();
  };
};

/**
 * Récupère toutes les notifications programmées
 * 
 * @returns Liste des notifications programmées
 */
export const getAllScheduledNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    return await Notifications.getAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications programmées:', error);
    return [];
  }
};