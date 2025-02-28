/**
 * Hook personnalisé pour la gestion des alarmes
 * Fournit une interface simplifiée pour interagir avec les alarmes
 */

import { useState, useCallback, useEffect } from 'react';
import { Alarm, WeekDay, WakeUpMode, WakeUpSettings } from '../types/alarm';
import { useAlarms } from '../contexts/AlarmsContext';
import { calculateNextRingTime, formatRepeatDays } from '../utils/alarmUtils';
import { formatTime, formatDate, getTimeRemaining } from '../utils/dateUtils';
import { TimeFormat } from '../utils/constants';

// Interface pour la création d'une alarme
export interface CreateAlarmParams {
  name: string;
  hour: number;
  minute: number;
  repeatDays: WeekDay[];
  wakeUpSettings: WakeUpSettings;
  active?: boolean;
}

// Interface pour la mise à jour d'une alarme
export interface UpdateAlarmParams {
  id: string;
  name?: string;
  hour?: number;
  minute?: number;
  repeatDays?: WeekDay[];
  wakeUpSettings?: WakeUpSettings;
  active?: boolean;
}

// Interface d'informations sur l'alarme pour l'UI
export interface AlarmInfo {
  id: string;
  name: string;
  timeFormatted: string;
  repeatDaysFormatted: string;
  nextAlarmDate: string | null;
  timeRemaining: string | null;
  active: boolean;
  mode: WakeUpMode;
  modeName: string;
  modeDetail: string;
}

/**
 * Hook de gestion des alarmes
 */
export const useAlarmsManager = () => {
  // Contexte des alarmes
  const {
    alarms,
    loading,
    error,
    nextAlarm,
    addAlarm,
    updateAlarm,
    deleteAlarm,
    toggleAlarm,
    snoozeAlarm,
    dismissAlarm,
    refreshAlarms
  } = useAlarms();
  
  // État pour le suivi du temps restant
  const [timeRemainingInterval, setTimeRemainingInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Mettre à jour le temps restant régulièrement
  useEffect(() => {
    // Nettoyer l'intervalle existant
    if (timeRemainingInterval) {
      clearInterval(timeRemainingInterval);
    }
    
    // Créer un nouvel intervalle si une alarme est active
    if (nextAlarm && nextAlarm.nextRingTime) {
      const interval = setInterval(() => {
        // Forcer une mise à jour en appelant une fonction vide
        // Cela permettra de recalculer timeRemaining
        refreshAlarms();
      }, 60000); // Mise à jour chaque minute
      
      setTimeRemainingInterval(interval);
    }
    
    // Nettoyage à la fermeture
    return () => {
      if (timeRemainingInterval) {
        clearInterval(timeRemainingInterval);
      }
    };
  }, [nextAlarm]);
  
  /**
   * Crée une nouvelle alarme
   */
  const createAlarm = useCallback(
    async (params: CreateAlarmParams) => {
      const { name, hour, minute, repeatDays, wakeUpSettings, active = true } = params;
      
      const newAlarm: Omit<Alarm, 'id' | 'nextRingTime' | 'notificationId'> = {
        name,
        hour,
        minute,
        repeatDays,
        wakeUpSettings,
        active
      };
      
      await addAlarm(newAlarm);
    },
    [addAlarm]
  );
  
  /**
   * Met à jour une alarme existante
   */
  const editAlarm = useCallback(
    async (params: UpdateAlarmParams) => {
      const { id } = params;
      
      // Trouver l'alarme existante
      const existingAlarm = alarms.find(alarm => alarm.id === id);
      if (!existingAlarm) {
        throw new Error(`Alarme avec ID ${id} non trouvée`);
      }
      
      // Créer une nouvelle alarme avec les paramètres mis à jour
      const updatedAlarm: Alarm = {
        ...existingAlarm,
        name: params.name !== undefined ? params.name : existingAlarm.name,
        hour: params.hour !== undefined ? params.hour : existingAlarm.hour,
        minute: params.minute !== undefined ? params.minute : existingAlarm.minute,
        repeatDays: params.repeatDays !== undefined ? params.repeatDays : existingAlarm.repeatDays,
        wakeUpSettings: params.wakeUpSettings !== undefined ? params.wakeUpSettings : existingAlarm.wakeUpSettings,
        active: params.active !== undefined ? params.active : existingAlarm.active
      };
      
      // Recalculer la prochaine sonnerie
      updatedAlarm.nextRingTime = calculateNextRingTime(updatedAlarm);
      
      await updateAlarm(updatedAlarm);
    },
    [alarms, updateAlarm]
  );
  
  /**
   * Change l'état d'activation d'une alarme
   */
  const toggleAlarmState = useCallback(
    async (id: string, active: boolean) => {
      await toggleAlarm(id, active);
    },
    [toggleAlarm]
  );
  
  /**
   * Reporte une alarme qui sonne
   */
  const snoozeActiveAlarm = useCallback(
    async (id: string, durationMinutes?: number) => {
      await snoozeAlarm(id, durationMinutes);
    },
    [snoozeAlarm]
  );
  
  /**
   * Arrête une alarme qui sonne
   */
  const dismissActiveAlarm = useCallback(
    async (id: string) => {
      await dismissAlarm(id);
    },
    [dismissAlarm]
  );
  
  /**
   * Supprime une alarme
   */
  const removeAlarm = useCallback(
    async (id: string) => {
      await deleteAlarm(id);
    },
    [deleteAlarm]
  );
  
  /**
   * Convertit une alarme en informations formatées pour l'UI
   */
  const formatAlarmForDisplay = useCallback(
    (alarm: Alarm, timeFormat: TimeFormat = TimeFormat.Format24h): AlarmInfo => {
      // Formater l'heure
      const timeFormatted = formatTime(alarm.hour, alarm.minute, timeFormat);
      
      // Formater les jours de répétition
      const repeatDaysFormatted = formatRepeatDays(alarm.repeatDays);
      
      // Formater la prochaine date de sonnerie
      let nextAlarmDate: string | null = null;
      let timeRemaining: string | null = null;
      
      if (alarm.active && alarm.nextRingTime) {
        nextAlarmDate = formatDate(alarm.nextRingTime);
        timeRemaining = getTimeRemaining(alarm.nextRingTime);
      }
      
      // Obtenir les détails du mode de réveil
      let modeName = '';
      let modeDetail = '';
      
      switch (alarm.wakeUpSettings.type) {
        case WakeUpMode.Radio:
          modeName = 'Radio';
          modeDetail = (alarm.wakeUpSettings as any).stationName || '';
          break;
        case WakeUpMode.Spotify:
          modeName = 'Spotify';
          modeDetail = (alarm.wakeUpSettings as any).playlistName || 
                         (alarm.wakeUpSettings as any).trackName || '';
          break;
        case WakeUpMode.Horoscope:
          modeName = 'Horoscope';
          modeDetail = `Signe: ${(alarm.wakeUpSettings as any).zodiacSign || ''}`;
          break;
        default:
          modeName = 'Inconnu';
          modeDetail = '';
      }
      
      return {
        id: alarm.id,
        name: alarm.name,
        timeFormatted,
        repeatDaysFormatted,
        nextAlarmDate,
        timeRemaining,
        active: alarm.active,
        mode: alarm.wakeUpSettings.type,
        modeName,
        modeDetail
      };
    },
    []
  );
  
  /**
   * Convertit toutes les alarmes en informations formatées pour l'UI
   */
  const getFormattedAlarms = useCallback(
    (timeFormat: TimeFormat = TimeFormat.Format24h): AlarmInfo[] => {
      return alarms.map(alarm => formatAlarmForDisplay(alarm, timeFormat));
    },
    [alarms, formatAlarmForDisplay]
  );
  
  /**
   * Obtient les informations sur la prochaine alarme
   */
  const getNextAlarmInfo = useCallback(
    (timeFormat: TimeFormat = TimeFormat.Format24h): AlarmInfo | null => {
      if (!nextAlarm) {
        return null;
      }
      
      return formatAlarmForDisplay(nextAlarm, timeFormat);
    },
    [nextAlarm, formatAlarmForDisplay]
  );
  
  /**
   * Vérifie si une alarme spécifique est la prochaine à sonner
   */
  const isNextAlarm = useCallback(
    (alarmId: string): boolean => {
      return nextAlarm?.id === alarmId;
    },
    [nextAlarm]
  );
  
  return {
    // États
    alarms,
    loading,
    error,
    nextAlarm,
    
    // Actions de base
    refreshAlarms,
    
    // Actions avancées
    createAlarm,
    editAlarm,
    toggleAlarmState,
    snoozeActiveAlarm,
    dismissActiveAlarm,
    removeAlarm,
    
    // Fonctions utilitaires
    formatAlarmForDisplay,
    getFormattedAlarms,
    getNextAlarmInfo,
    isNextAlarm
  };
};