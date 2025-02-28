/**
 * Utilitaires pour la manipulation des dates et heures
 */

import { WeekDay } from '../types/alarm';
import { TimeFormat } from './constants';

/**
 * Convertit un jour de la semaine JavaScript (0-6, dimanche = 0) en WeekDay enum (0-6, lundi = 0)
 */
export const jsWeekDayToAppWeekDay = (jsWeekDay: number): WeekDay => {
  // JavaScript: 0 = dimanche, 1 = lundi, ..., 6 = samedi
  // Notre app: 0 = lundi, 1 = mardi, ..., 6 = dimanche
  return ((jsWeekDay + 6) % 7) as WeekDay;
};

/**
 * Convertit un WeekDay enum (0-6, lundi = 0) en jour de la semaine JavaScript (0-6, dimanche = 0)
 */
export const appWeekDayToJsWeekDay = (appWeekDay: WeekDay): number => {
  // Notre app: 0 = lundi, 1 = mardi, ..., 6 = dimanche
  // JavaScript: 0 = dimanche, 1 = lundi, ..., 6 = samedi
  return (appWeekDay + 1) % 7;
};

/**
 * Retourne le jour de la semaine actuel selon l'enum WeekDay
 */
export const getCurrentWeekDay = (): WeekDay => {
  const jsWeekDay = new Date().getDay();
  return jsWeekDayToAppWeekDay(jsWeekDay);
};

/**
 * Vérifie si une date est aujourd'hui
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

/**
 * Vérifie si une date est demain
 */
export const isTomorrow = (date: Date): boolean => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getDate() === tomorrow.getDate() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getFullYear() === tomorrow.getFullYear()
  );
};

/**
 * Formate une heure au format 12h ou 24h
 */
export const formatTime = (
  hours: number,
  minutes: number,
  format: TimeFormat = TimeFormat.Format24h
): string => {
  if (format === TimeFormat.Format12h) {
    const period = hours < 12 ? 'AM' : 'PM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
};

/**
 * Formate une date pour afficher "Aujourd'hui", "Demain" ou la date complète
 */
export const formatDate = (date: Date): string => {
  if (isToday(date)) {
    return "Aujourd'hui";
  } else if (isTomorrow(date)) {
    return "Demain";
  } else {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }
};

/**
 * Calcule le temps restant jusqu'à une date sous forme de texte
 */
export const getTimeRemaining = (targetDate: Date): string => {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return "Maintenant";
  }
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) {
    return diffDays === 1 ? "Dans 1 jour" : `Dans ${diffDays} jours`;
  } else if (diffHours > 0) {
    return diffHours === 1 ? "Dans 1 heure" : `Dans ${diffHours} heures`;
  } else if (diffMin > 0) {
    return diffMin === 1 ? "Dans 1 minute" : `Dans ${diffMin} minutes`;
  } else {
    return "Moins d'une minute";
  }
};

/**
 * Calcule l'heure actuelle sous forme d'objet {heure, minute}
 */
export const getCurrentTime = (): { hour: number; minute: number } => {
  const now = new Date();
  return {
    hour: now.getHours(),
    minute: now.getMinutes(),
  };
};

/**
 * Convertit des heures et minutes en millisecondes
 */
export const timeToMilliseconds = (hours: number, minutes: number): number => {
  return (hours * 60 * 60 + minutes * 60) * 1000;
};

/**
 * Calcule le nombre de millisecondes jusqu'à la prochaine occurrence d'une heure spécifique
 */
export const getMillisecondsUntilTime = (hours: number, minutes: number): number => {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  
  // Si l'heure cible est déjà passée aujourd'hui, on vise demain
  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  
  return target.getTime() - now.getTime();
};