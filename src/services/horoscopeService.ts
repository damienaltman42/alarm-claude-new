/**
 * Service pour récupérer l'horoscope quotidien
 * Utilise l'API aztro pour les prédictions
 */

import { DailyHoroscope, HoroscopeServiceError } from '../types/horoscope';
import { API_URLS } from '../utils/constants';
import { ZodiacSign } from '../types/alarm';

/**
 * Récupère l'horoscope du jour pour un signe
 * 
 * @param sign - Signe du zodiaque
 * @returns Horoscope quotidien pour le signe spécifié
 */
export const fetchDailyHoroscope = async (sign: ZodiacSign): Promise<DailyHoroscope> => {
  try {
    // L'API aztro utilise une méthode POST pour récupérer les données
    const response = await fetch(`${API_URLS.HOROSCOPE_API}/?sign=${sign}&day=today`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw {
        code: response.status,
        message: `Erreur API: ${response.status} ${response.statusText}`,
        sign
      };
    }
    
    const data = await response.json();
    
    // Mapper la réponse au format DailyHoroscope
    return {
      sign,
      date: data.current_date,
      prediction: data.description,
      lucky: {
        number: parseInt(data.lucky_number),
        color: data.color
      },
      mood: data.mood,
      compatibility: data.compatibility?.toLowerCase() as ZodiacSign,
      intensity: Math.floor(Math.random() * 10) + 1 // L'API ne fournit pas cette donnée, on la génère
    };
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'horoscope pour ${sign}:`, error);
    
    // Si l'erreur a déjà le format attendu, la propager
    if ((error as HoroscopeServiceError).code) {
      throw error as HoroscopeServiceError;
    }
    
    // Sinon, créer une nouvelle erreur formatée
    throw {
      code: 500,
      message: `Impossible de récupérer l'horoscope pour ${sign}`,
      sign
    } as HoroscopeServiceError;
  }
};

/**
 * Génère un horoscope de secours en cas d'erreur de l'API
 * 
 * @param sign - Signe du zodiaque
 * @returns Horoscope généré localement
 */
export const generateFallbackHoroscope = (sign: ZodiacSign): DailyHoroscope => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Messages génériques pour chaque signe
  const predictions: Record<ZodiacSign, string> = {
    [ZodiacSign.Aries]: "Votre énergie débordante vous pousse à relever de nouveaux défis aujourd'hui. C'est le moment idéal pour commencer ce projet qui vous tient à cœur.",
    [ZodiacSign.Taurus]: "La patience est votre force aujourd'hui. Prenez le temps d'apprécier les petits plaisirs et de consolider vos acquis.",
    [ZodiacSign.Gemini]: "Votre curiosité naturelle vous ouvre de nouvelles portes. Les conversations d'aujourd'hui pourraient vous apporter des informations précieuses.",
    [ZodiacSign.Cancer]: "Votre sensibilité est à fleur de peau aujourd'hui. Accordez-vous des moments de calme et entourez-vous de personnes bienveillantes.",
    [ZodiacSign.Leo]: "Votre charisme naturel vous met en valeur aujourd'hui. C'est le moment de prendre des initiatives et de briller en société.",
    [ZodiacSign.Virgo]: "Votre sens du détail fait merveille aujourd'hui. Une approche méthodique vous aidera à résoudre un problème persistant.",
    [ZodiacSign.Libra]: "L'harmonie est votre quête du jour. Cherchez l'équilibre dans vos relations et vos décisions pour avancer sereinement.",
    [ZodiacSign.Scorpio]: "Votre intuition est particulièrement affûtée aujourd'hui. Faites-lui confiance pour prendre des décisions importantes.",
    [ZodiacSign.Sagittarius]: "L'aventure vous appelle ! C'est le moment d'élargir vos horizons et d'explorer de nouvelles idées ou territoires.",
    [ZodiacSign.Capricorn]: "Votre persévérance porte ses fruits aujourd'hui. Continuez sur cette voie et vous atteindrez vos objectifs.",
    [ZodiacSign.Aquarius]: "Votre originalité est votre atout majeur aujourd'hui. N'hésitez pas à proposer des solutions innovantes aux problèmes rencontrés.",
    [ZodiacSign.Pisces]: "Votre sensibilité artistique est exacerbée aujourd'hui. Accordez-vous du temps pour explorer vos passions créatives."
  };
  
  // Couleurs de chance pour chaque signe
  const luckyColors: Record<ZodiacSign, string> = {
    [ZodiacSign.Aries]: "Rouge",
    [ZodiacSign.Taurus]: "Vert",
    [ZodiacSign.Gemini]: "Jaune",
    [ZodiacSign.Cancer]: "Blanc",
    [ZodiacSign.Leo]: "Or",
    [ZodiacSign.Virgo]: "Vert forêt",
    [ZodiacSign.Libra]: "Bleu ciel",
    [ZodiacSign.Scorpio]: "Noir",
    [ZodiacSign.Sagittarius]: "Pourpre",
    [ZodiacSign.Capricorn]: "Marron",
    [ZodiacSign.Aquarius]: "Bleu électrique",
    [ZodiacSign.Pisces]: "Turquoise"
  };
  
  // Humeurs pour chaque signe
  const moods: Record<ZodiacSign, string> = {
    [ZodiacSign.Aries]: "Énergique",
    [ZodiacSign.Taurus]: "Serein",
    [ZodiacSign.Gemini]: "Curieux",
    [ZodiacSign.Cancer]: "Sensible",
    [ZodiacSign.Leo]: "Confiant",
    [ZodiacSign.Virgo]: "Méthodique",
    [ZodiacSign.Libra]: "Harmonieux",
    [ZodiacSign.Scorpio]: "Intuitif",
    [ZodiacSign.Sagittarius]: "Aventureux",
    [ZodiacSign.Capricorn]: "Déterminé",
    [ZodiacSign.Aquarius]: "Innovant",
    [ZodiacSign.Pisces]: "Rêveur"
  };
  
  // Générer un nombre chanceux en fonction du signe et de la date
  const generateLuckyNumber = (sign: string, date: Date): number => {
    const signValue = sign.charCodeAt(0) + sign.charCodeAt(1);
    const dateValue = date.getDate() + date.getMonth();
    return ((signValue + dateValue) % 99) + 1;
  };
  
  return {
    sign,
    date: dateStr,
    prediction: predictions[sign],
    lucky: {
      number: generateLuckyNumber(sign, today),
      color: luckyColors[sign]
    },
    mood: moods[sign],
    intensity: ((sign.charCodeAt(0) + today.getDate()) % 10) + 1
  };
};

/**
 * Détermine le signe du zodiaque en fonction d'une date de naissance
 * 
 * @param birthdate - Date de naissance
 * @returns Signe du zodiaque correspondant
 */
export const getZodiacSignFromBirthdate = (birthdate: Date): ZodiacSign => {
  const day = birthdate.getDate();
  const month = birthdate.getMonth() + 1; // getMonth() retourne 0-11
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return ZodiacSign.Aries;
  } else if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return ZodiacSign.Taurus;
  } else if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return ZodiacSign.Gemini;
  } else if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return ZodiacSign.Cancer;
  } else if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return ZodiacSign.Leo;
  } else if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return ZodiacSign.Virgo;
  } else if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return ZodiacSign.Libra;
  } else if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return ZodiacSign.Scorpio;
  } else if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return ZodiacSign.Sagittarius;
  } else if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
    return ZodiacSign.Capricorn;
  } else if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return ZodiacSign.Aquarius;
  } else {
    return ZodiacSign.Pisces;
  }
};

/**
 * Récupère l'horoscope pour un signe donné avec gestion des erreurs
 * 
 * @param sign - Signe du zodiaque
 * @param useFallback - Si true, utilise la génération locale en cas d'erreur
 * @returns Horoscope récupéré ou généré localement
 */
export const getHoroscopeWithFallback = async (
  sign: ZodiacSign, 
  useFallback: boolean = true
): Promise<DailyHoroscope> => {
  try {
    // Essayer d'abord de récupérer l'horoscope depuis l'API
    return await fetchDailyHoroscope(sign);
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'horoscope:`, error);
    
    // Si l'option de secours est activée, générer un horoscope local
    if (useFallback) {
      console.log(`Utilisation de l'horoscope de secours pour ${sign}`);
      return generateFallbackHoroscope(sign);
    } else {
      // Sinon, propager l'erreur
      throw error;
    }
  }
};

/**
 * Cache pour stocker les horoscopes récupérés aujourd'hui
 */
const horoscopeCache: Record<ZodiacSign, { data: DailyHoroscope, timestamp: number }> = {} as any;

/**
 * Récupère l'horoscope avec mise en cache
 * 
 * @param sign - Signe du zodiaque
 * @param forceRefresh - Si true, ignore le cache et force une nouvelle requête
 * @returns Horoscope récupéré ou depuis le cache
 */
export const getCachedHoroscope = async (
  sign: ZodiacSign,
  forceRefresh: boolean = false
): Promise<DailyHoroscope> => {
  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000; // 24 heures en millisecondes
  
  // Vérifier si l'horoscope est en cache et s'il est encore valide (moins de 24h)
  if (
    !forceRefresh &&
    horoscopeCache[sign] &&
    horoscopeCache[sign].timestamp > now - ONE_DAY
  ) {
    return horoscopeCache[sign].data;
  }
  
  // Récupérer un nouvel horoscope
  const horoscope = await getHoroscopeWithFallback(sign);
  
  // Mettre en cache
  horoscopeCache[sign] = {
    data: horoscope,
    timestamp: now
  };
  
  return horoscope;
};