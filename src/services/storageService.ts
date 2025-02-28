/**
 * Service pour le stockage local des données
 * Utilise AsyncStorage pour persister les données entre les sessions
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alarm } from '../types/alarm';
import { SpotifyAuth } from '../types/spotify';
import { STORAGE_KEYS } from '../utils/constants';

// Type pour les préférences utilisateur
export interface UserPreferences {
  zodiacSign?: string;
  darkMode: boolean;
  timeFormat: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  snoozeDuration: number;
}

// Valeurs par défaut pour les préférences utilisateur
const DEFAULT_USER_PREFERENCES: UserPreferences = {
  darkMode: false,
  timeFormat: '24h',
  soundEnabled: true,
  vibrationEnabled: true,
  snoozeDuration: 9, // 9 minutes par défaut
};

/**
 * Sauvegarde les alarmes dans le stockage local
 * 
 * @param alarms - Liste des alarmes à sauvegarder
 */
export const saveAlarms = async (alarms: Alarm[]): Promise<void> => {
  try {
    // Conversion des dates en chaînes pour le stockage
    const alarmsToSave = alarms.map(alarm => ({
      ...alarm,
      nextRingTime: alarm.nextRingTime ? alarm.nextRingTime.toISOString() : null,
    }));
    
    await AsyncStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarmsToSave));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des alarmes:', error);
    throw new Error('Impossible de sauvegarder les alarmes');
  }
};

/**
 * Récupère les alarmes depuis le stockage local
 * 
 * @returns Liste des alarmes stockées ou tableau vide si aucune
 */
export const loadAlarms = async (): Promise<Alarm[]> => {
  try {
    const alarmsJson = await AsyncStorage.getItem(STORAGE_KEYS.ALARMS);
    
    if (!alarmsJson) {
      return [];
    }
    
    // Parse et conversion des chaînes en objets Date
    const parsedAlarms = JSON.parse(alarmsJson);
    
    return parsedAlarms.map((alarm: any) => ({
      ...alarm,
      nextRingTime: alarm.nextRingTime ? new Date(alarm.nextRingTime) : null,
    }));
  } catch (error) {
    console.error('Erreur lors du chargement des alarmes:', error);
    return [];
  }
};

/**
 * Sauvegarde les informations d'authentification Spotify
 * 
 * @param auth - Données d'authentification Spotify
 */
export const saveSpotifyAuth = async (auth: SpotifyAuth): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.SPOTIFY_AUTH, JSON.stringify(auth));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des données Spotify:', error);
    throw new Error('Impossible de sauvegarder les données Spotify');
  }
};

/**
 * Récupère les informations d'authentification Spotify
 * 
 * @returns Données d'authentification Spotify ou null si non trouvées
 */
export const loadSpotifyAuth = async (): Promise<SpotifyAuth | null> => {
  try {
    const authJson = await AsyncStorage.getItem(STORAGE_KEYS.SPOTIFY_AUTH);
    
    if (!authJson) {
      return null;
    }
    
    return JSON.parse(authJson) as SpotifyAuth;
  } catch (error) {
    console.error('Erreur lors du chargement des données Spotify:', error);
    return null;
  }
};

/**
 * Supprime les informations d'authentification Spotify
 */
export const clearSpotifyAuth = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.SPOTIFY_AUTH);
  } catch (error) {
    console.error('Erreur lors de la suppression des données Spotify:', error);
  }
};

/**
 * Sauvegarde les préférences utilisateur
 * 
 * @param preferences - Préférences utilisateur à sauvegarder
 */
export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des préférences:', error);
    throw new Error('Impossible de sauvegarder les préférences');
  }
};

/**
 * Récupère les préférences utilisateur
 * 
 * @returns Préférences utilisateur ou valeurs par défaut si non trouvées
 */
export const loadUserPreferences = async (): Promise<UserPreferences> => {
  try {
    const preferencesJson = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    
    if (!preferencesJson) {
      return DEFAULT_USER_PREFERENCES;
    }
    
    // Fusionner avec les valeurs par défaut pour assurer la compatibilité future
    return { ...DEFAULT_USER_PREFERENCES, ...JSON.parse(preferencesJson) };
  } catch (error) {
    console.error('Erreur lors du chargement des préférences:', error);
    return DEFAULT_USER_PREFERENCES;
  }
};

/**
 * Sauvegarde la préférence de thème (clair/sombre)
 * 
 * @param isDarkMode - True pour le mode sombre, false pour le mode clair
 */
export const saveThemePreference = async (isDarkMode: boolean): Promise<void> => {
  try {
    const prefs = await loadUserPreferences();
    await saveUserPreferences({
      ...prefs,
      darkMode: isDarkMode,
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du thème:', error);
  }
};

/**
 * Efface toutes les données stockées (pour réinitialisation)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    const keys = [
      STORAGE_KEYS.ALARMS,
      STORAGE_KEYS.SPOTIFY_AUTH,
      STORAGE_KEYS.USER_PREFERENCES,
      STORAGE_KEYS.THEME,
    ];
    
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation des données:', error);
    throw new Error('Impossible de réinitialiser les données');
  }
};