/**
 * Service pour la recherche et lecture des stations de radio
 * Utilise l'API publique radio-browser.info
 */

import { Audio } from 'expo-av';
import { RadioStation, RadioSearchParams, RadioSearchResponse } from '../types/radio';
import { API_URLS } from '../utils/constants';

let radioPlayer: Audio.Sound | null = null;
let currentStationId: string | null = null;

/**
 * Recherche des stations de radio selon les critères spécifiés
 * 
 * @param params - Paramètres de recherche
 * @returns Résultats de la recherche
 */
export const searchRadioStations = async (params: RadioSearchParams): Promise<RadioSearchResponse> => {
  try {
    // Construire l'URL avec les paramètres
    const searchParams = new URLSearchParams();
    
    if (params.query) searchParams.append('name', params.query);
    if (params.country) searchParams.append('country', params.country);
    if (params.genre) searchParams.append('tag', params.genre);
    
    // Ajouter les paramètres de pagination
    searchParams.append('limit', String(params.limit || 20));
    searchParams.append('offset', String(params.offset || 0));
    
    // Trier par popularité par défaut
    searchParams.append('order', 'clickcount');
    searchParams.append('reverse', 'true');
    
    // Effectuer la requête à l'API
    const response = await fetch(`${API_URLS.RADIO_API}/stations/search?${searchParams.toString()}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const stations: any[] = await response.json();
    
    // Mapper les résultats au format RadioStation
    const mappedStations: RadioStation[] = stations.map(station => ({
      id: station.stationuuid,
      name: station.name,
      url: station.url_resolved || station.url,
      country: station.country,
      genre: station.tags ? station.tags.split(',').map((tag: string) => tag.trim()) : [],
      logo: station.favicon,
      bitrate: station.bitrate,
      popularity: station.clickcount
    }));
    
    return {
      stations: mappedStations,
      total: stations.length,
      offset: params.offset || 0,
      limit: params.limit || 20
    };
  } catch (error) {
    console.error('Erreur lors de la recherche de stations radio:', error);
    return {
      stations: [],
      total: 0,
      offset: params.offset || 0,
      limit: params.limit || 20
    };
  }
};

/**
 * Récupère les stations de radio populaires
 * 
 * @param limit - Nombre maximum de stations à récupérer
 * @returns Liste des stations populaires
 */
export const getPopularStations = async (limit: number = 20): Promise<RadioStation[]> => {
  try {
    const response = await fetch(`${API_URLS.RADIO_API}/stations/topclick/${limit}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const stations: any[] = await response.json();
    
    // Mapper les résultats au format RadioStation
    return stations.map(station => ({
      id: station.stationuuid,
      name: station.name,
      url: station.url_resolved || station.url,
      country: station.country,
      genre: station.tags ? station.tags.split(',').map((tag: string) => tag.trim()) : [],
      logo: station.favicon,
      bitrate: station.bitrate,
      popularity: station.clickcount
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des stations populaires:', error);
    return [];
  }
};

/**
 * Récupère les genres de radio disponibles
 * 
 * @param limit - Nombre maximum de genres à récupérer
 * @returns Liste des genres disponibles
 */
export const getRadioGenres = async (limit: number = 30): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URLS.RADIO_API}/tags?order=stationcount&reverse=true&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const genres: any[] = await response.json();
    
    // Extraire les noms des genres
    return genres.map(genre => genre.name);
  } catch (error) {
    console.error('Erreur lors de la récupération des genres radio:', error);
    return [];
  }
};

/**
 * Récupère les pays disponibles pour les stations de radio
 * 
 * @param limit - Nombre maximum de pays à récupérer
 * @returns Liste des pays disponibles
 */
export const getRadioCountries = async (limit: number = 50): Promise<string[]> => {
  try {
    const response = await fetch(`${API_URLS.RADIO_API}/countries?order=stationcount&reverse=true&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const countries: any[] = await response.json();
    
    // Extraire les noms des pays
    return countries.map(country => country.name);
  } catch (error) {
    console.error('Erreur lors de la récupération des pays radio:', error);
    return [];
  }
};

/**
 * Récupère une station de radio par son ID
 * 
 * @param stationId - ID de la station
 * @returns La station trouvée ou null si non trouvée
 */
export const getRadioStationById = async (stationId: string): Promise<RadioStation | null> => {
  try {
    const response = await fetch(`${API_URLS.RADIO_API}/stations/byuuid/${stationId}`);
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const stations: any[] = await response.json();
    
    if (stations.length === 0) {
      return null;
    }
    
    const station = stations[0];
    
    return {
      id: station.stationuuid,
      name: station.name,
      url: station.url_resolved || station.url,
      country: station.country,
      genre: station.tags ? station.tags.split(',').map((tag: string) => tag.trim()) : [],
      logo: station.favicon,
      bitrate: station.bitrate,
      popularity: station.clickcount
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération de la station ${stationId}:`, error);
    return null;
  }
};

/**
 * Vérifie si l'URL de la station est valide et peut être lue
 * 
 * @param url - URL de la station à vérifier
 * @returns Booléen indiquant si l'URL est valide
 */
export const checkStationUrlValidity = async (url: string): Promise<boolean> => {
  try {
    // Essayer de charger le son sans le lire
    const { sound } = await Audio.Sound.createAsync(
      { uri: url },
      { shouldPlay: false }
    );
    
    // Si on arrive ici, l'URL est probablement valide
    await sound.unloadAsync();
    return true;
  } catch (error) {
    console.error('URL de station radio invalide:', error);
    return false;
  }
};

/**
 * Joue une station de radio
 * 
 * @param station - Station à jouer
 * @returns Booléen indiquant si la lecture a démarré avec succès
 */
export const playRadioStation = async (station: RadioStation): Promise<boolean> => {
  try {
    // Si une station est déjà en cours de lecture, l'arrêter
    if (radioPlayer) {
      await stopRadio();
    }
    
    // Configurer l'audio pour la lecture en arrière-plan
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    // Créer et charger le son
    const { sound } = await Audio.Sound.createAsync(
      { uri: station.url },
      { shouldPlay: true },
      onPlaybackStatusUpdate
    );
    
    radioPlayer = sound;
    currentStationId = station.id;
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la lecture de la station radio:', error);
    return false;
  }
};

/**
 * Callback pour les mises à jour de statut de lecture
 */
const onPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
  // Gérer les erreurs de lecture
  if (status.isLoaded === false && status.error) {
    console.error('Erreur de lecture audio:', status.error);
  }
};

/**
 * Arrête la lecture de la radio en cours
 */
export const stopRadio = async (): Promise<void> => {
  if (radioPlayer) {
    try {
      await radioPlayer.stopAsync();
      await radioPlayer.unloadAsync();
      radioPlayer = null;
      currentStationId = null;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la radio:', error);
    }
  }
};

/**
 * Met en pause/reprend la lecture de la radio
 * 
 * @returns Booléen indiquant si la radio est en pause après l'appel
 */
export const toggleRadioPlayback = async (): Promise<boolean> => {
  if (!radioPlayer) {
    return false;
  }
  
  try {
    const status = await radioPlayer.getStatusAsync();
    
    if (status.isLoaded) {
      if (status.isPlaying) {
        await radioPlayer.pauseAsync();
        return true; // En pause
      } else {
        await radioPlayer.playAsync();
        return false; // En lecture
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors du changement d\'état de lecture:', error);
    return false;
  }
};

/**
 * Vérifie si une station est en cours de lecture
 * 
 * @param stationId - ID de la station à vérifier (optionnel)
 * @returns Booléen indiquant si la station est en cours de lecture
 */
export const isRadioPlaying = async (stationId?: string): Promise<boolean> => {
  if (!radioPlayer) {
    return false;
  }
  
  // Si un ID de station est fourni, vérifier qu'il s'agit de la station en cours
  if (stationId && stationId !== currentStationId) {
    return false;
  }
  
  try {
    const status = await radioPlayer.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'état de lecture:', error);
    return false;
  }
};

/**
 * Règle le volume de la radio
 * 
 * @param volume - Niveau de volume (0 à 1)
 */
export const setRadioVolume = async (volume: number): Promise<void> => {
  if (!radioPlayer) {
    return;
  }
  
  try {
    // S'assurer que le volume est entre 0 et 1
    const safeVolume = Math.max(0, Math.min(1, volume));
    await radioPlayer.setVolumeAsync(safeVolume);
  } catch (error) {
    console.error('Erreur lors du réglage du volume:', error);
  }
};

/**
 * Nettoie les ressources audio (à appeler lors du démontage des composants)
 */
export const cleanupRadioResources = async (): Promise<void> => {
  await stopRadio();
  
  // Réinitialiser le mode audio
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      playsInSilentModeIOS: false,
      shouldDuckAndroid: false,
      playThroughEarpieceAndroid: false,
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mode audio:', error);
  }
};