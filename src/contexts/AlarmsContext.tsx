/**
 * Contexte pour la gestion des alarmes
 * Fournit un accès global aux alarmes et aux fonctions de gestion
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alarm, AlarmEvent, WakeUpMode, WakeUpSettings } from '../types/alarm';
import {
  addAlarm as addAlarmService,
  updateAlarm as updateAlarmService,
  deleteAlarm as deleteAlarmService,
  toggleAlarm as toggleAlarmService,
  snoozeAlarm as snoozeAlarmService,
  dismissAlarm as dismissAlarmService,
  updateAllAlarmNotifications,
  setupAlarmNotificationListener
} from '../services/alarmService';
import { loadAlarms } from './../services/storageService';
import { sortAlarmsByNextRingTime, getNextAlarmToRing } from '../utils/alarmUtils';

// Interface pour le contexte des alarmes
interface AlarmsContextType {
  alarms: Alarm[];
  loading: boolean;
  error: string | null;
  nextAlarm: Alarm | null;
  addAlarm: (alarmData: Omit<Alarm, 'id' | 'nextRingTime' | 'notificationId'>) => Promise<void>;
  updateAlarm: (alarm: Alarm) => Promise<void>;
  deleteAlarm: (alarmId: string) => Promise<void>;
  toggleAlarm: (alarmId: string, active: boolean) => Promise<void>;
  snoozeAlarm: (alarmId: string, snoozeDurationMinutes?: number) => Promise<void>;
  dismissAlarm: (alarmId: string) => Promise<void>;
  refreshAlarms: () => Promise<void>;
  triggerAlarm: (alarmId: string) => void;
}

// Création du contexte avec des valeurs par défaut
const AlarmsContext = createContext<AlarmsContextType>({
  alarms: [],
  loading: false,
  error: null,
  nextAlarm: null,
  addAlarm: async () => {},
  updateAlarm: async () => {},
  deleteAlarm: async () => {},
  toggleAlarm: async () => {},
  snoozeAlarm: async () => {},
  dismissAlarm: async () => {},
  refreshAlarms: async () => {},
  triggerAlarm: () => {}
});

// Props du provider
interface AlarmsProviderProps {
  children: ReactNode;
}

/**
 * Provider pour le contexte des alarmes
 */
export const AlarmsProvider: React.FC<AlarmsProviderProps> = ({ children }) => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [nextAlarm, setNextAlarm] = useState<Alarm | null>(null);
  
  // Charge les alarmes au démarrage
  useEffect(() => {
    refreshAlarms();
    
    // Configurer le listener pour les notifications d'alarme
    const unsubscribe = setupAlarmNotificationListener((alarm, event) => {
      console.log('Événement d\'alarme:', event, alarm);
      if (event === AlarmEvent.Triggered) {
        triggerAlarm(alarm.id);
      }
    });
    
    // Nettoyage du listener à la fermeture
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Met à jour la prochaine alarme à chaque changement d'alarmes
  useEffect(() => {
    setNextAlarm(getNextAlarmToRing(alarms));
  }, [alarms]);
  
  /**
   * Rafraîchit la liste des alarmes depuis le stockage
   */
  const refreshAlarms = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Charger les alarmes
      const loadedAlarms = await loadAlarms();
      
      // Mettre à jour les notifications
      const updatedAlarms = await updateAllAlarmNotifications(loadedAlarms);
      
      // Trier les alarmes
      const sortedAlarms = sortAlarmsByNextRingTime(updatedAlarms);
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error('Erreur lors du chargement des alarmes:', error);
      setError('Impossible de charger les alarmes');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Ajoute une nouvelle alarme
   */
  const addAlarm = async (alarmData: Omit<Alarm, 'id' | 'nextRingTime' | 'notificationId'>): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Ajouter l'alarme
      const updatedAlarms = await addAlarmService(alarmData);
      
      // Trier les alarmes
      const sortedAlarms = sortAlarmsByNextRingTime(updatedAlarms);
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'alarme:', error);
      setError('Impossible d\'ajouter l\'alarme');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Met à jour une alarme existante
   */
  const updateAlarm = async (alarm: Alarm): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Mettre à jour l'alarme
      const updatedAlarms = await updateAlarmService(alarm);
      
      // Trier les alarmes
      const sortedAlarms = sortAlarmsByNextRingTime(updatedAlarms);
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'alarme:', error);
      setError('Impossible de mettre à jour l\'alarme');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Supprime une alarme
   */
  const deleteAlarm = async (alarmId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Supprimer l'alarme
      const updatedAlarms = await deleteAlarmService(alarmId);
      
      // Trier les alarmes
      const sortedAlarms = sortAlarmsByNextRingTime(updatedAlarms);
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'alarme:', error);
      setError('Impossible de supprimer l\'alarme');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Active ou désactive une alarme
   */
  const toggleAlarm = async (alarmId: string, active: boolean): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Activer/désactiver l'alarme
      const updatedAlarms = await toggleAlarmService(alarmId, active);
      
      // Trier les alarmes
      const sortedAlarms = sortAlarmsByNextRingTime(updatedAlarms);
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error('Erreur lors de l\'activation/désactivation de l\'alarme:', error);
      setError('Impossible de modifier l\'état de l\'alarme');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Reporte une alarme (snooze)
   */
  const snoozeAlarm = async (alarmId: string, snoozeDurationMinutes?: number): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Reporter l'alarme
      const snoozeResult = await snoozeAlarmService(alarmId, snoozeDurationMinutes);
      
      if (snoozeResult) {
        // Mettre à jour l'alarme dans la liste
        const updatedAlarms = alarms.map(alarm => 
          alarm.id === alarmId ? snoozeResult : alarm
        );
        
        // Trier les alarmes
        const sortedAlarms = sortAlarmsByNextRingTime(updatedAlarms);
        
        setAlarms(sortedAlarms);
      }
    } catch (error) {
      console.error('Erreur lors du report de l\'alarme:', error);
      setError('Impossible de reporter l\'alarme');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Arrête une alarme qui sonne
   */
  const dismissAlarm = async (alarmId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      // Arrêter l'alarme
      const updatedAlarms = await dismissAlarmService(alarmId);
      
      // Trier les alarmes
      const sortedAlarms = sortAlarmsByNextRingTime(updatedAlarms);
      
      setAlarms(sortedAlarms);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'alarme:', error);
      setError('Impossible d\'arrêter l\'alarme');
    } finally {
      setLoading(false);
    }
  };
  
  /**
   * Déclenche une alarme (à appeler quand une alarme doit sonner)
   */
  const triggerAlarm = (alarmId: string): void => {
    // Trouver l'alarme correspondante
    const alarm = alarms.find(a => a.id === alarmId);
    
    if (!alarm) {
      // console.error(`Alarme ${alarmId} non trouvée`);
      return;
    }
    
    // Ici, on pourrait naviguer vers un écran d'alarme en cours,
    // ou envoyer un événement à un autre composant pour gérer le son et l'affichage
    
    // console.log(`Alarme ${alarmId} déclenchée:`, alarm);
    
    // Note: la navigation vers l'écran d'alarme sera gérée par le composant App
    // ou par le navigateur, en utilisant un hook d'événements pour écouter les événements d'alarme
  };
  
  // Valeur du contexte
  const value: AlarmsContextType = {
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
    refreshAlarms,
    triggerAlarm
  };
  
  return (
    <AlarmsContext.Provider value={value}>
      {children}
    </AlarmsContext.Provider>
  );
};

/**
 * Hook pour accéder au contexte des alarmes
 */
export const useAlarms = (): AlarmsContextType => {
  const context = useContext(AlarmsContext);
  
  if (context === undefined) {
    throw new Error('useAlarms doit être utilisé à l\'intérieur d\'un AlarmsProvider');
  }
  
  return context;
};