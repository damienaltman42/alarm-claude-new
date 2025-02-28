/**
 * Types et interfaces pour la gestion des alarmes
 */

// Type pour les jours de la semaine
export enum WeekDay {
    Monday = 0,
    Tuesday = 1,
    Wednesday = 2,
    Thursday = 3,
    Friday = 4,
    Saturday = 5,
    Sunday = 6
  }
  
  // Mode de réveil disponibles
  export enum WakeUpMode {
    Radio = "radio",
    Spotify = "spotify",
    Horoscope = "horoscope"
  }
  
  // Interface de base pour tous les modes de réveil
  export interface WakeUpSetting {
    type: WakeUpMode;
  }
  
  // Paramètres spécifiques au mode Radio
  export interface RadioWakeUpSetting extends WakeUpSetting {
    type: WakeUpMode.Radio;
    stationId: string;
    stationName: string;
    stationUrl: string;
  }
  
  // Paramètres spécifiques au mode Spotify
  export interface SpotifyWakeUpSetting extends WakeUpSetting {
    type: WakeUpMode.Spotify;
    playlistId?: string;
    trackId?: string;
    playlistName?: string;
    trackName?: string;
  }
  
  // Paramètres spécifiques au mode Horoscope
  export interface HoroscopeWakeUpSetting extends WakeUpSetting {
    type: WakeUpMode.Horoscope;
    zodiacSign: ZodiacSign;
    // Son d'alarme par défaut pour le mode Horoscope
    soundId: string;
  }
  
  // Type pour les paramètres de réveil (union type)
  export type WakeUpSettings = 
    | RadioWakeUpSetting 
    | SpotifyWakeUpSetting 
    | HoroscopeWakeUpSetting;
  
  // Type pour les signes du zodiaque
  export enum ZodiacSign {
    Aries = "aries",
    Taurus = "taurus",
    Gemini = "gemini",
    Cancer = "cancer",
    Leo = "leo",
    Virgo = "virgo",
    Libra = "libra",
    Scorpio = "scorpio",
    Sagittarius = "sagittarius",
    Capricorn = "capricorn",
    Aquarius = "aquarius",
    Pisces = "pisces"
  }
  
  // Interface principale pour une alarme
  export interface Alarm {
    id: string;
    name: string;
    hour: number;
    minute: number;
    active: boolean;
    repeatDays: WeekDay[]; // Jours de répétition
    wakeUpSettings: WakeUpSettings; // Paramètres du mode de réveil
    nextRingTime: Date | null; // Prochaine date de sonnerie
    notificationId?: string; // ID de la notification programmée
  }
  
  // Type pour les événements d'alarme
  export enum AlarmEvent {
    Created = "alarm_created",
    Updated = "alarm_updated",
    Deleted = "alarm_deleted",
    Toggled = "alarm_toggled",
    Triggered = "alarm_triggered",
    Snoozed = "alarm_snoozed",
    Dismissed = "alarm_dismissed"
  }