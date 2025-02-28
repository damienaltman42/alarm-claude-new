/**
 * Utilitaires pour la gestion des alarmes
 */

import { Alarm, WeekDay } from '../types/alarm';
import { appWeekDayToJsWeekDay, jsWeekDayToAppWeekDay } from './dateUtils';

/**
 * Calcule la prochaine date de sonnerie pour une alarme
 * 
 * @param alarm - L'alarme pour laquelle calculer la prochaine sonnerie
 * @returns Date de la prochaine sonnerie ou null si l'alarme n'est pas active ou n'a pas de jours de répétition
 */
export const calculateNextRingTime = (alarm: Alarm): Date | null => {
  if (!alarm.active) {
    return null;
  }

  const now = new Date();
  const currentJsDayOfWeek = now.getDay(); // 0 = dimanche, 1 = lundi, ...
  const currentAppDayOfWeek = jsWeekDayToAppWeekDay(currentJsDayOfWeek); // 0 = lundi, 1 = mardi, ...
  
  // Créer une date pour l'heure de l'alarme aujourd'hui
  const alarmTimeToday = new Date();
  alarmTimeToday.setHours(alarm.hour, alarm.minute, 0, 0);
  
  // Si l'alarme ne se répète pas, elle sonne aujourd'hui ou demain selon l'heure actuelle
  if (alarm.repeatDays.length === 0) {
    if (alarmTimeToday.getTime() > now.getTime()) {
      return alarmTimeToday;
    } else {
      // Alarme pour demain à la même heure
      const tomorrow = new Date(alarmTimeToday);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow;
    }
  }
  
  // Trier les jours de répétition pour faciliter la recherche
  const sortedRepeatDays = [...alarm.repeatDays].sort((a, b) => a - b);
  
  // Trouver le prochain jour de répétition
  let nextAlarmDay: WeekDay | null = null;
  let daysToAdd = 0;
  
  // 1. Vérifier si l'alarme doit sonner aujourd'hui
  if (sortedRepeatDays.includes(currentAppDayOfWeek) && alarmTimeToday.getTime() > now.getTime()) {
    nextAlarmDay = currentAppDayOfWeek;
    daysToAdd = 0;
  } 
  // 2. Sinon, chercher le prochain jour programmé
  else {
    // Chercher d'abord dans les jours restants de la semaine en cours
    for (const day of sortedRepeatDays) {
      if (day > currentAppDayOfWeek) {
        nextAlarmDay = day;
        daysToAdd = day - currentAppDayOfWeek;
        break;
      }
    }
    
    // Si aucun jour n'a été trouvé, prendre le premier jour de la semaine suivante
    if (nextAlarmDay === null && sortedRepeatDays.length > 0) {
      nextAlarmDay = sortedRepeatDays[0];
      daysToAdd = 7 - currentAppDayOfWeek + nextAlarmDay;
    }
  }
  
  // Si aucun jour valide n'a été trouvé (cas où repeatDays est vide), retourner null
  if (nextAlarmDay === null) {
    return null;
  }
  
  // Créer la date pour la prochaine sonnerie
  const nextRingTime = new Date(alarmTimeToday);
  nextRingTime.setDate(nextRingTime.getDate() + daysToAdd);
  
  return nextRingTime;
};

/**
 * Trie les alarmes par ordre de sonnerie
 * 
 * @param alarms - Liste des alarmes à trier
 * @returns Liste des alarmes triées
 */
export const sortAlarmsByNextRingTime = (alarms: Alarm[]): Alarm[] => {
  return [...alarms].sort((a, b) => {
    // Les alarmes inactives vont à la fin
    if (!a.active && b.active) return 1;
    if (a.active && !b.active) return -1;
    
    // Si les deux sont inactives, trier par heure
    if (!a.active && !b.active) {
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    }
    
    // Si les deux sont actives mais n'ont pas de nextRingTime, comparer l'heure
    if (!a.nextRingTime && !b.nextRingTime) {
      if (a.hour !== b.hour) return a.hour - b.hour;
      return a.minute - b.minute;
    }
    
    // Mettre les alarmes sans nextRingTime à la fin
    if (!a.nextRingTime) return 1;
    if (!b.nextRingTime) return -1;
    
    // Sinon, trier par prochain temps de sonnerie
    return a.nextRingTime.getTime() - b.nextRingTime.getTime();
  });
};

/**
 * Met à jour les prochaines dates de sonnerie pour toutes les alarmes
 * 
 * @param alarms - Liste des alarmes à mettre à jour
 * @returns Liste des alarmes avec les dates de sonnerie mises à jour
 */
export const updateAllNextRingTimes = (alarms: Alarm[]): Alarm[] => {
  return alarms.map(alarm => ({
    ...alarm,
    nextRingTime: calculateNextRingTime(alarm)
  }));
};

/**
 * Trouve l'alarme qui sonnera en premier
 * 
 * @param alarms - Liste des alarmes
 * @returns L'alarme qui sonnera en premier, ou null si aucune alarme active
 */
export const getNextAlarmToRing = (alarms: Alarm[]): Alarm | null => {
  const activeAlarms = alarms.filter(alarm => alarm.active && alarm.nextRingTime !== null);
  
  if (activeAlarms.length === 0) {
    return null;
  }
  
  return activeAlarms.reduce((nextAlarm, currentAlarm) => {
    if (!nextAlarm.nextRingTime) return currentAlarm;
    if (!currentAlarm.nextRingTime) return nextAlarm;
    
    return currentAlarm.nextRingTime.getTime() < nextAlarm.nextRingTime.getTime()
      ? currentAlarm
      : nextAlarm;
  }, activeAlarms[0]);
};

/**
 * Génère un ID unique pour une nouvelle alarme
 */
export const generateAlarmId = (): string => {
  return 'alarm_' + Date.now().toString() + '_' + Math.floor(Math.random() * 1000).toString();
};

/**
 * Vérifie si une alarme doit sonner maintenant
 */
export const shouldAlarmRingNow = (alarm: Alarm): boolean => {
  if (!alarm.active || !alarm.nextRingTime) {
    return false;
  }
  
  const now = new Date();
  const diffMs = Math.abs(alarm.nextRingTime.getTime() - now.getTime());
  
  // Considérer que l'alarme doit sonner si on est à moins de 60 secondes de l'heure prévue
  return diffMs < 60 * 1000;
};

/**
 * Formate les jours de répétition en texte
 */
export const formatRepeatDays = (repeatDays: WeekDay[]): string => {
  if (repeatDays.length === 0) {
    return "Une seule fois";
  }
  
  if (repeatDays.length === 7) {
    return "Tous les jours";
  }
  
  if (repeatDays.length === 5 && 
      repeatDays.includes(WeekDay.Monday) && 
      repeatDays.includes(WeekDay.Tuesday) && 
      repeatDays.includes(WeekDay.Wednesday) && 
      repeatDays.includes(WeekDay.Thursday) && 
      repeatDays.includes(WeekDay.Friday) && 
      !repeatDays.includes(WeekDay.Saturday) && 
      !repeatDays.includes(WeekDay.Sunday)) {
    return "Jours ouvrés";
  }
  
  if (repeatDays.length === 2 && 
      repeatDays.includes(WeekDay.Saturday) && 
      repeatDays.includes(WeekDay.Sunday) && 
      !repeatDays.includes(WeekDay.Monday) && 
      !repeatDays.includes(WeekDay.Tuesday) && 
      !repeatDays.includes(WeekDay.Wednesday) && 
      !repeatDays.includes(WeekDay.Thursday) && 
      !repeatDays.includes(WeekDay.Friday)) {
    return "Week-ends";
  }
  
  // Convertir les jours en noms courts et les joindre
  const { WEEKDAY_SHORT_NAMES } = require('./constants');
  return repeatDays
    .sort((a, b) => a - b)
    .map(day => WEEKDAY_SHORT_NAMES[day])
    .join(', ');
};