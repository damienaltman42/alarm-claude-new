/**
 * Types et interfaces pour le service Spotify
 */

// Interface pour l'authentification Spotify
export interface SpotifyAuth {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    expiresAt: number; // Timestamp d'expiration
  }
  
  // Interface pour une piste Spotify
  export interface SpotifyTrack {
    id: string;
    name: string;
    artistName: string;
    albumName: string;
    durationMs: number;
    imageUrl?: string;
    previewUrl?: string;
  }
  
  // Interface pour une playlist Spotify
  export interface SpotifyPlaylist {
    id: string;
    name: string;
    description?: string;
    owner: string;
    imageUrl?: string;
    totalTracks: number;
    isPublic: boolean;
  }
  
  // Paramètres de recherche Spotify
  export interface SpotifySearchParams {
    query: string;
    type: 'track' | 'playlist' | 'album' | 'artist';
    limit?: number;
    offset?: number;
  }
  
  // Réponse de recherche Spotify
  export interface SpotifySearchResponse {
    tracks?: {
      items: SpotifyTrack[];
      total: number;
    };
    playlists?: {
      items: SpotifyPlaylist[];
      total: number;
    };
  }