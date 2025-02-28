/**
 * Service pour l'intégration avec Spotify
 * Gère l'authentification OAuth et les appels API
 */

import { Audio } from 'expo-av';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import {
  SpotifyAuth,
  SpotifyPlaylist,
  SpotifySearchParams,
  SpotifySearchResponse,
  SpotifyTrack
} from '../types/spotify';
import { API_URLS, SPOTIFY_CONFIG } from '../utils/constants';
import { loadSpotifyAuth, saveSpotifyAuth, clearSpotifyAuth } from './storageService';

let spotifyPlayer: Audio.Sound | null = null;
let currentTrackId: string | null = null;

/**
 * Génère l'URL d'authentification Spotify
 * 
 * @returns URL d'authentification
 */
export const getSpotifyAuthUrl = (): string => {
  const redirectUri = encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI);
  const scopes = encodeURIComponent(SPOTIFY_CONFIG.SCOPES);

  return `${API_URLS.SPOTIFY_AUTH}?client_id=${SPOTIFY_CONFIG.CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=${scopes}`;
};

/**
 * Lance le processus d'authentification Spotify
 * 
 * @returns Données d'authentification ou null si échec
 */
export const authenticateWithSpotify = async (): Promise<SpotifyAuth | null> => {
  try {
    // Vérifier d'abord si nous avons déjà des tokens valides en stockage
    const existingAuth = await loadSpotifyAuth();
    if (existingAuth && existingAuth.expiresAt > Date.now()) {
      return existingAuth;
    }
    
    // Si nous avons un refresh token expiré, l'utiliser pour obtenir un nouveau token
    if (existingAuth && existingAuth.refreshToken) {
      const refreshedAuth = await refreshSpotifyToken(existingAuth.refreshToken);
      if (refreshedAuth) {
        return refreshedAuth;
      }
    }
    
    // Sinon, lancer une nouvelle authentification
    const authUrl = getSpotifyAuthUrl();
    
    // Configurer l'URL de redirection pour intercepter le callback
    const redirectUrl = Linking.createURL('spotify-callback');
    
    // Ouvrir le navigateur pour l'authentification
    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    
    if (result.type === 'success' && result.url) {
      // Extraire le code d'autorisation de l'URL de redirection
      const url = new URL(result.url);
      const code = url.searchParams.get('code');
      
      if (code) {
        // Échanger le code contre des tokens
        const auth = await exchangeCodeForToken(code);
        
        if (auth) {
          // Sauvegarder les tokens
          await saveSpotifyAuth(auth);
          return auth;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de l\'authentification Spotify:', error);
    return null;
  }
};

/**
 * Échange le code d'autorisation contre des tokens d'accès
 * 
 * @param code - Code d'autorisation obtenu après l'authentification
 * @returns Données d'authentification ou null si échec
 */
const exchangeCodeForToken = async (code: string): Promise<SpotifyAuth | null> => {
  try {
    const redirectUri = encodeURIComponent(SPOTIFY_CONFIG.REDIRECT_URI);
    
    const response = await fetch(API_URLS.SPOTIFY_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CONFIG.CLIENT_ID}:YOUR_CLIENT_SECRET`)}`,
      },
      body: `grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}`,
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Calculer le timestamp d'expiration
    const expiresAt = Date.now() + data.expires_in * 1000;
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      expiresAt
    };
  } catch (error) {
    console.error('Erreur lors de l\'échange du code d\'autorisation:', error);
    return null;
  }
};

/**
 * Rafraîchit le token d'accès à l'aide du refresh token
 * 
 * @param refreshToken - Refresh token
 * @returns Nouvelles données d'authentification ou null si échec
 */
export const refreshSpotifyToken = async (refreshToken: string): Promise<SpotifyAuth | null> => {
  try {
    const response = await fetch(API_URLS.SPOTIFY_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${SPOTIFY_CONFIG.CLIENT_ID}:YOUR_CLIENT_SECRET`)}`,
      },
      body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
    });
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Calculer le timestamp d'expiration
    const expiresAt = Date.now() + data.expires_in * 1000;
    
    // Le refresh token peut être ou ne pas être inclus dans la réponse
    const newRefreshToken = data.refresh_token || refreshToken;
    
    const auth: SpotifyAuth = {
      accessToken: data.access_token,
      refreshToken: newRefreshToken,
      expiresIn: data.expires_in,
      expiresAt
    };
    
    // Sauvegarder les nouveaux tokens
    await saveSpotifyAuth(auth);
    
    return auth;
  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    return null;
  }
};

/**
 * Vérifie si l'utilisateur est authentifié à Spotify et que le token est valide
 * 
 * @returns Booléen indiquant si l'utilisateur est authentifié
 */
export const isAuthenticated = async (): Promise<boolean> => {
  const auth = await loadSpotifyAuth();
  
  if (!auth) {
    return false;
  }
  
  // Si le token est expiré, essayer de le rafraîchir
  if (auth.expiresAt <= Date.now()) {
    const refreshedAuth = await refreshSpotifyToken(auth.refreshToken);
    return !!refreshedAuth;
  }
  
  return true;
};

/**
 * Déconnecte l'utilisateur de Spotify en supprimant les tokens
 */
export const logout = async (): Promise<void> => {
  await clearSpotifyAuth();
};

/**
 * Effectue une requête à l'API Spotify
 * 
 * @param endpoint - Point d'entrée de l'API (sans le préfixe)
 * @param method - Méthode HTTP
 * @param body - Corps de la requête (optionnel)
 * @returns Données de la réponse ou null si échec
 */
const spotifyApiRequest = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<any> => {
  try {
    // Vérifier l'authentification
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      throw new Error('Non authentifié à Spotify');
    }
    
    // Récupérer le token
    const auth = await loadSpotifyAuth();
    if (!auth) {
      throw new Error('Token Spotify non disponible');
    }
    
    // Préparer les en-têtes
    const headers: HeadersInit = {
      'Authorization': `Bearer ${auth.accessToken}`,
      'Content-Type': 'application/json',
    };
    
    // Préparer les options de requête
    const options: RequestInit = {
      method,
      headers,
    };
    
    // Ajouter le corps si présent
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    // Effectuer la requête
    const response = await fetch(`${API_URLS.SPOTIFY_API}${endpoint}`, options);
    
    // Si token expiré, le rafraîchir et réessayer
    if (response.status === 401) {
      const refreshedAuth = await refreshSpotifyToken(auth.refreshToken);
      
      if (refreshedAuth) {
        // Mettre à jour le token dans les en-têtes
        headers['Authorization'] = `Bearer ${refreshedAuth.accessToken}`;
        options.headers = headers;
        
        // Réessayer la requête
        const newResponse = await fetch(`${API_URLS.SPOTIFY_API}${endpoint}`, options);
        
        if (!newResponse.ok) {
          throw new Error(`Erreur API: ${newResponse.status} ${newResponse.statusText}`);
        }
        
        return await newResponse.json();
      } else {
        throw new Error('Impossible de rafraîchir le token');
      }
    }
    
    if (!response.ok) {
      throw new Error(`Erreur API: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Erreur lors de la requête à l'API Spotify (${endpoint}):`, error);
    return null;
  }
};

/**
 * Recherche des pistes ou playlists sur Spotify
 * 
 * @param params - Paramètres de recherche
 * @returns Résultats de recherche ou null si échec
 */
export const searchSpotify = async (params: SpotifySearchParams): Promise<SpotifySearchResponse | null> => {
  try {
    const searchParams = new URLSearchParams();
    searchParams.append('q', params.query);
    searchParams.append('type', params.type);
    searchParams.append('limit', String(params.limit || 20));
    searchParams.append('offset', String(params.offset || 0));
    
    const data = await spotifyApiRequest(`/search?${searchParams.toString()}`);
    
    if (!data) {
      return null;
    }
    
    const result: SpotifySearchResponse = {};
    
    // Mapper les pistes si présentes
    if (data.tracks && data.tracks.items) {
      result.tracks = {
        items: data.tracks.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          artistName: item.artists.map((artist: any) => artist.name).join(', '),
          albumName: item.album.name,
          durationMs: item.duration_ms,
          imageUrl: item.album.images[0]?.url,
          previewUrl: item.preview_url
        })),
        total: data.tracks.total
      };
    }
    
    // Mapper les playlists si présentes
    if (data.playlists && data.playlists.items) {
      result.playlists = {
        items: data.playlists.items.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          owner: item.owner.display_name,
          imageUrl: item.images[0]?.url,
          totalTracks: item.tracks.total,
          isPublic: item.public
        })),
        total: data.playlists.total
      };
    }
    
    return result;
  } catch (error) {
    console.error('Erreur lors de la recherche Spotify:', error);
    return null;
  }
};

/**
 * Récupère les playlists de l'utilisateur
 * 
 * @param limit - Nombre maximum de playlists à récupérer
 * @param offset - Indice de début
 * @returns Liste des playlists ou null si échec
 */
export const getUserPlaylists = async (limit: number = 20, offset: number = 0): Promise<SpotifyPlaylist[] | null> => {
  try {
    const data = await spotifyApiRequest(`/me/playlists?limit=${limit}&offset=${offset}`);
    
    if (!data || !data.items) {
      return null;
    }
    
    return data.items.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      owner: item.owner.display_name,
      imageUrl: item.images[0]?.url,
      totalTracks: item.tracks.total,
      isPublic: item.public
    }));
  } catch (error) {
    console.error('Erreur lors de la récupération des playlists:', error);
    return null;
  }
};

/**
 * Récupère les pistes d'une playlist
 * 
 * @param playlistId - ID de la playlist
 * @param limit - Nombre maximum de pistes à récupérer
 * @param offset - Indice de début
 * @returns Liste des pistes ou null si échec
 */
export const getPlaylistTracks = async (
  playlistId: string,
  limit: number = 50,
  offset: number = 0
): Promise<SpotifyTrack[] | null> => {
  try {
    const data = await spotifyApiRequest(`/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`);
    
    if (!data || !data.items) {
      return null;
    }
    
    return data.items.map((item: any) => {
      const track = item.track;
      return {
        id: track.id,
        name: track.name,
        artistName: track.artists.map((artist: any) => artist.name).join(', '),
        albumName: track.album.name,
        durationMs: track.duration_ms,
        imageUrl: track.album.images[0]?.url,
        previewUrl: track.preview_url
      };
    });
  } catch (error) {
    console.error(`Erreur lors de la récupération des pistes de la playlist ${playlistId}:`, error);
    return null;
  }
};

/**
 * Récupère les détails d'un morceau
 * 
 * @param trackId - ID du morceau
 * @returns Détails du morceau ou null si échec
 */
export const getTrackDetails = async (trackId: string): Promise<SpotifyTrack | null> => {
  try {
    const data = await spotifyApiRequest(`/tracks/${trackId}`);
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      artistName: data.artists.map((artist: any) => artist.name).join(', '),
      albumName: data.album.name,
      durationMs: data.duration_ms,
      imageUrl: data.album.images[0]?.url,
      previewUrl: data.preview_url
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails du morceau ${trackId}:`, error);
    return null;
  }
};

/**
 * Récupère les détails d'une playlist
 * 
 * @param playlistId - ID de la playlist
 * @returns Détails de la playlist ou null si échec
 */
export const getPlaylistDetails = async (playlistId: string): Promise<SpotifyPlaylist | null> => {
  try {
    const data = await spotifyApiRequest(`/playlists/${playlistId}`);
    
    if (!data) {
      return null;
    }
    
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      owner: data.owner.display_name,
      imageUrl: data.images[0]?.url,
      totalTracks: data.tracks.total,
      isPublic: data.public
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération des détails de la playlist ${playlistId}:`, error);
    return null;
  }
};

/**
 * Joue un morceau Spotify (à partir de son URL de prévisualisation)
 * 
 * @param track - Morceau à jouer
 * @returns Booléen indiquant si la lecture a démarré avec succès
 */
export const playSpotifyPreview = async (track: SpotifyTrack): Promise<boolean> => {
  try {
    // Vérifier si un aperçu est disponible
    if (!track.previewUrl) {
      console.error(`Aucun aperçu disponible pour le morceau ${track.id}`);
      return false;
    }
    
    // Arrêter la lecture en cours
    if (spotifyPlayer) {
      await stopSpotifyPlayback();
    }
    
    // Configurer l'audio pour la lecture
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    
    // Créer et charger le son
    const { sound } = await Audio.Sound.createAsync(
      { uri: track.previewUrl },
      { shouldPlay: true },
      onSpotifyPlaybackStatusUpdate
    );
    
    spotifyPlayer = sound;
    currentTrackId = track.id;
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la lecture du morceau ${track.id}:`, error);
    return false;
  }
};

/**
 * Callback pour les mises à jour de statut de lecture Spotify
 */
const onSpotifyPlaybackStatusUpdate = (status: Audio.PlaybackStatus) => {
  // Gérer les erreurs de lecture
  if (status.isLoaded === false && status.error) {
    console.error('Erreur de lecture audio Spotify:', status.error);
  }
  
  // Gérer la fin de lecture
  if (status.isLoaded && status.didJustFinish) {
    spotifyPlayer = null;
    currentTrackId = null;
  }
};

/**
 * Arrête la lecture Spotify en cours
 */
export const stopSpotifyPlayback = async (): Promise<void> => {
  if (spotifyPlayer) {
    try {
      await spotifyPlayer.stopAsync();
      await spotifyPlayer.unloadAsync();
      spotifyPlayer = null;
      currentTrackId = null;
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de la lecture Spotify:', error);
    }
  }
};

/**
 * Met en pause/reprend la lecture Spotify
 * 
 * @returns Booléen indiquant si la lecture est en pause après l'appel
 */
export const toggleSpotifyPlayback = async (): Promise<boolean> => {
  if (!spotifyPlayer) {
    return false;
  }
  
  try {
    const status = await spotifyPlayer.getStatusAsync();
    
    if (status.isLoaded) {
      if (status.isPlaying) {
        await spotifyPlayer.pauseAsync();
        return true; // En pause
      } else {
        await spotifyPlayer.playAsync();
        return false; // En lecture
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erreur lors du changement d\'état de lecture Spotify:', error);
    return false;
  }
};

/**
 * Vérifie si un morceau est en cours de lecture
 * 
 * @param trackId - ID du morceau à vérifier (optionnel)
 * @returns Booléen indiquant si le morceau est en cours de lecture
 */
export const isSpotifyPlaying = async (trackId?: string): Promise<boolean> => {
  if (!spotifyPlayer) {
    return false;
  }
  
  // Si un ID de morceau est fourni, vérifier qu'il s'agit du morceau en cours
  if (trackId && trackId !== currentTrackId) {
    return false;
  }
  
  try {
    const status = await spotifyPlayer.getStatusAsync();
    return status.isLoaded && status.isPlaying;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'état de lecture Spotify:', error);
    return false;
  }
};

/**
 * Ouvre un morceau ou une playlist dans l'application Spotify
 * 
 * @param type - Type d'élément à ouvrir ('track' ou 'playlist')
 * @param id - ID de l'élément
 * @returns Booléen indiquant si l'ouverture a réussi
 */
export const openInSpotifyApp = async (type: 'track' | 'playlist', id: string): Promise<boolean> => {
  try {
    const url = `spotify:${type}:${id}`;
    const supported = await Linking.canOpenURL(url);
    
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      // Fallback sur la version web
      const webUrl = `https://open.spotify.com/${type}/${id}`;
      await Linking.openURL(webUrl);
      return true;
    }
  } catch (error) {
    console.error(`Erreur lors de l'ouverture de l'élément Spotify (${type} ${id}):`, error);
    return false;
  }
};

/**
 * Nettoie les ressources audio (à appeler lors du démontage des composants)
 */
export const cleanupSpotifyResources = async (): Promise<void> => {
  await stopSpotifyPlayback();
  
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