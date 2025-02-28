/**
 * Types et interfaces pour le service de radio
 */

// Interface pour une station de radio
export interface RadioStation {
    id: string;
    name: string;
    url: string;
    country: string;
    genre: string[];
    logo?: string;
    bitrate?: number;
    popularity?: number;
  }
  
  // Paramètres de recherche pour les stations
  export interface RadioSearchParams {
    query?: string;
    country?: string;
    genre?: string;
    limit?: number;
    offset?: number;
  }
  
  // Réponse de l'API pour la recherche de stations
  export interface RadioSearchResponse {
    stations: RadioStation[];
    total: number;
    offset: number;
    limit: number;
  }