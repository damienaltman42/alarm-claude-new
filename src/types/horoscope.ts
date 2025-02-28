/**
 * Types et interfaces pour le service d'horoscope
 */

import { ZodiacSign } from './alarm';

// Interface pour un horoscope quotidien
export interface DailyHoroscope {
  sign: ZodiacSign;
  date: string;
  prediction: string;
  lucky: {
    number: number;
    color: string;
  };
  mood: string;
  compatibility?: ZodiacSign;
  intensity?: number; // 1-10 rating for intensity of the day
}

// Erreur du service d'horoscope
export interface HoroscopeServiceError {
  code: number;
  message: string;
  date?: string;
  sign?: ZodiacSign;
}

// État de la récupération de l'horoscope
export enum HoroscopeFetchStatus {
  Idle = 'idle',
  Loading = 'loading',
  Success = 'success',
  Error = 'error'
}

// État du service d'horoscope
export interface HoroscopeState {
  status: HoroscopeFetchStatus;
  data: DailyHoroscope | null;
  error: HoroscopeServiceError | null;
  lastUpdated: number | null; // Timestamp de dernière mise à jour
}