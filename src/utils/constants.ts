/**
 * Constantes utilisées dans l'application
 */

import { WeekDay, ZodiacSign } from '../types/alarm';

// Clés pour le stockage local
export const STORAGE_KEYS = {
  ALARMS: 'aurorwake_alarms',
  THEME: 'aurorwake_theme',
  SPOTIFY_AUTH: 'aurorwake_spotify_auth',
  USER_PREFERENCES: 'aurorwake_user_preferences',
};

// URL des API
export const API_URLS = {
  RADIO_API: 'https://de1.api.radio-browser.info/json', // API gratuite pour les stations de radio
  HOROSCOPE_API: 'https://aztro.sameerkumar.website', // API pour l'horoscope
  SPOTIFY_AUTH: 'https://accounts.spotify.com/authorize',
  SPOTIFY_TOKEN: 'https://accounts.spotify.com/api/token',
  SPOTIFY_API: 'https://api.spotify.com/v1',
};

// Configuration de l'authentification Spotify
export const SPOTIFY_CONFIG = {
  CLIENT_ID: 'YOUR_SPOTIFY_CLIENT_ID', // À remplacer avec votre ID client Spotify
  REDIRECT_URI: 'exp://YOUR_EXPO_SERVER/--/spotify-callback',
  SCOPES: [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'user-library-read',
    'user-read-playback-state',
    'user-modify-playback-state',
  ].join(' '),
};

// Noms des jours de la semaine pour l'affichage
export const WEEKDAY_NAMES = {
  [WeekDay.Monday]: 'Lundi',
  [WeekDay.Tuesday]: 'Mardi',
  [WeekDay.Wednesday]: 'Mercredi',
  [WeekDay.Thursday]: 'Jeudi',
  [WeekDay.Friday]: 'Vendredi',
  [WeekDay.Saturday]: 'Samedi',
  [WeekDay.Sunday]: 'Dimanche',
};

// Noms courts des jours pour l'affichage compact
export const WEEKDAY_SHORT_NAMES = {
  [WeekDay.Monday]: 'Lun',
  [WeekDay.Tuesday]: 'Mar',
  [WeekDay.Wednesday]: 'Mer',
  [WeekDay.Thursday]: 'Jeu',
  [WeekDay.Friday]: 'Ven',
  [WeekDay.Saturday]: 'Sam',
  [WeekDay.Sunday]: 'Dim',
};

// Noms des signes du zodiaque pour l'affichage
export const ZODIAC_SIGN_NAMES = {
  [ZodiacSign.Aries]: 'Bélier',
  [ZodiacSign.Taurus]: 'Taureau',
  [ZodiacSign.Gemini]: 'Gémeaux',
  [ZodiacSign.Cancer]: 'Cancer',
  [ZodiacSign.Leo]: 'Lion',
  [ZodiacSign.Virgo]: 'Vierge',
  [ZodiacSign.Libra]: 'Balance',
  [ZodiacSign.Scorpio]: 'Scorpion',
  [ZodiacSign.Sagittarius]: 'Sagittaire',
  [ZodiacSign.Capricorn]: 'Capricorne',
  [ZodiacSign.Aquarius]: 'Verseau',
  [ZodiacSign.Pisces]: 'Poissons',
};

// Dates des signes du zodiaque (jour et mois)
export const ZODIAC_SIGN_DATES = {
  [ZodiacSign.Aries]: { startMonth: 3, startDay: 21, endMonth: 4, endDay: 19 },
  [ZodiacSign.Taurus]: { startMonth: 4, startDay: 20, endMonth: 5, endDay: 20 },
  [ZodiacSign.Gemini]: { startMonth: 5, startDay: 21, endMonth: 6, endDay: 20 },
  [ZodiacSign.Cancer]: { startMonth: 6, startDay: 21, endMonth: 7, endDay: 22 },
  [ZodiacSign.Leo]: { startMonth: 7, startDay: 23, endMonth: 8, endDay: 22 },
  [ZodiacSign.Virgo]: { startMonth: 8, startDay: 23, endMonth: 9, endDay: 22 },
  [ZodiacSign.Libra]: { startMonth: 9, startDay: 23, endMonth: 10, endDay: 22 },
  [ZodiacSign.Scorpio]: { startMonth: 10, startDay: 23, endMonth: 11, endDay: 21 },
  [ZodiacSign.Sagittarius]: { startMonth: 11, startDay: 22, endMonth: 12, endDay: 21 },
  [ZodiacSign.Capricorn]: { startMonth: 12, startDay: 22, endMonth: 1, endDay: 19 },
  [ZodiacSign.Aquarius]: { startMonth: 1, startDay: 20, endMonth: 2, endDay: 18 },
  [ZodiacSign.Pisces]: { startMonth: 2, startDay: 19, endMonth: 3, endDay: 20 },
};

// Couleurs de base du thème
export const COLORS = {
  PRIMARY: '#6b7fff',
  SECONDARY: '#ff6b9c',
  SUCCESS: '#4caf50',
  ERROR: '#f44336',
  WARNING: '#ff9800',
  INFO: '#2196f3',
  LIGHT: '#f5f5f5',
  DARK: '#212121',
  BACKGROUND_LIGHT: '#ffffff',
  BACKGROUND_DARK: '#121212',
  TEXT_LIGHT: '#ffffff',
  TEXT_DARK: '#212121',
  GRAY_LIGHT: '#e0e0e0',
  GRAY: '#9e9e9e',
  GRAY_DARK: '#616161',
};

// Sons d'alarme par défaut
export const DEFAULT_ALARM_SOUNDS = [
  { id: 'gentle-chime', name: 'Carillon Doux', file: 'gentle-chime.mp3' },
  { id: 'morning-birds', name: 'Oiseaux du Matin', file: 'morning-birds.mp3' },
  { id: 'soft-bells', name: 'Cloches Douces', file: 'soft-bells.mp3' },
  { id: 'zen-gong', name: 'Gong Zen', file: 'zen-gong.mp3' },
  { id: 'piano-wake', name: 'Réveil Piano', file: 'piano-wake.mp3' },
];

// Durée du snooze en minutes
export const SNOOZE_DURATION_MINUTES = 9;

// Délai de notification avant l'alarme (pour assurer le chargement audio)
export const PRE_ALARM_NOTIFICATION_SECONDS = 10;

// Modes d'affichage de l'heure (12h/24h)
export enum TimeFormat {
  Format12h = '12h',
  Format24h = '24h',
}

// Identifiant du channel de notification pour les alarmes
export const ALARM_NOTIFICATION_CHANNEL_ID = 'aurora-wake-alarms';