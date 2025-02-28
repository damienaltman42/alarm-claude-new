/**
 * Écran qui s'affiche lorsqu'une alarme sonne
 * Permet de mettre en snooze ou d'arrêter l'alarme
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ImageBackground
} from 'react-native';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import Button from '../components/Button';
import { useTheme } from '../hooks/useTheme';
import { useAlarmsManager } from '../hooks/useAlarmsManager';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WakeUpMode, Alarm } from '../types/alarm';
import { formatTime } from '../utils/dateUtils';
import { SNOOZE_DURATION_MINUTES } from '../utils/constants';
import { 
  playRadioStation, 
  stopRadio 
} from '../services/radioService';
import { 
  playSpotifyPreview, 
  stopSpotifyPlayback 
} from '../services/spotifyService';
import { 
  getCachedHoroscope, 
  getHoroscopeWithFallback 
} from '../services/horoscopeService';
import { DailyHoroscope } from '../types/horoscope';
import { TimeFormat } from '../utils/constants';

type RouteProps = RouteProp<RootStackParamList, 'AlarmRinging'>;

// Pattern de vibration
const VIBRATION_PATTERN = Platform.OS === 'ios' 
  ? [0, 1000, 500, 1000] 
  : [0, 500, 200, 500];

const AlarmRingingScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const { theme, makeStyles } = useTheme();
  const { alarms, snoozeActiveAlarm, dismissActiveAlarm } = useAlarmsManager();
  
  const { alarmId } = route.params;
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSnoozed, setIsSnoozed] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [horoscope, setHoroscope] = useState<DailyHoroscope | null>(null);
  const [isLoadingHoroscope, setIsLoadingHoroscope] = useState<boolean>(false);
  
  // Animation pour l'effet pulsant
  const [pulseAnim] = useState(new Animated.Value(1));
  const [rotateAnim] = useState(new Animated.Value(0));
  
  const styles = makeStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    safeArea: {
      flex: 1,
    },
    backgroundGradient: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%',
      padding: theme.spacing.m,
    },
    topContent: {
      alignItems: 'center',
      marginTop: theme.spacing.xl * 2,
    },
    timeText: {
      fontSize: 80,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textLight,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 5,
    },
    nameText: {
      fontSize: theme.typography.fontSize.xl,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textLight,
      textShadowColor: 'rgba(0, 0, 0, 0.3)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 5,
      marginTop: theme.spacing.m,
    },
    modeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.m,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.spacing.m,
    },
    modeIcon: {
      marginRight: theme.spacing.s,
    },
    modeText: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textLight,
    },
    middleContent: {
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      width: '100%',
    },
    horoscopeContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.spacing.m,
      padding: theme.spacing.l,
      width: '100%',
      maxWidth: 500,
      alignItems: 'center',
    },
    horoscopeTitle: {
      fontSize: theme.typography.fontSize.l,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.textLight,
      marginBottom: theme.spacing.m,
      textAlign: 'center',
    },
    horoscopePrediction: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textLight,
      textAlign: 'center',
      lineHeight: 24,
    },
    horoscopeLucky: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textLight,
      marginTop: theme.spacing.m,
      textAlign: 'center',
    },
    horoscopeLoading: {
      padding: theme.spacing.xl,
    },
    bottomContent: {
      width: '100%',
      marginBottom: theme.spacing.xl,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: theme.spacing.l,
    },
    snoozeButton: {
      marginRight: theme.spacing.s,
      flex: 1,
    },
    dismissButton: {
      marginLeft: theme.spacing.s,
      flex: 1,
    },
    statusText: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textLight,
      textAlign: 'center',
      marginTop: theme.spacing.m,
    },
  }));
  
  // Animations pulsantes
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    
    const rotate = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    
    pulse.start();
    rotate.start();
    
    return () => {
      pulse.stop();
      rotate.stop();
    };
  }, [pulseAnim, rotateAnim]);
  
  // Charger les données de l'alarme
  useEffect(() => {
    const loadAlarm = () => {
      const foundAlarm = alarms.find(a => a.id === alarmId);
      
      if (foundAlarm) {
        setAlarm(foundAlarm);
      }
      
      setLoading(false);
    };
    
    loadAlarm();
  }, [alarmId, alarms]);
  
  // Démarrer les effets sonores et les vibrations
  useFocusEffect(
    useCallback(() => {
      if (!alarm) return;
      
      // Démarrer les vibrations
      Vibration.vibrate(VIBRATION_PATTERN, true);
      
      // Déclenchement d'un retour haptique pour les appareils qui le supportent
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      // Lancer le mode de réveil approprié
      const startWakeUpMode = async () => {
        const wakeUpSettings = alarm.wakeUpSettings;
        
        switch (wakeUpSettings.type) {
          case WakeUpMode.Radio:
            try {
              const station = {
                id: (wakeUpSettings as any).stationId || 'default',
                name: (wakeUpSettings as any).stationName || 'Radio',
                url: (wakeUpSettings as any).stationUrl || '',
                country: 'FR',
                genre: [],
              };
              
              await playRadioStation(station);
            } catch (error) {
              console.error('Erreur lors de la lecture de la radio:', error);
              // Fallback à un son d'alarme par défaut
              playDefaultAlarmSound();
            }
            break;
            
          case WakeUpMode.Spotify:
            // Dans un cas réel, on utiliserait l'API Spotify
            // Pour cet exemple, on utilise juste un son par défaut
            playDefaultAlarmSound();
            break;
            
          case WakeUpMode.Horoscope:
            // Jouer un son doux pendant le chargement de l'horoscope
            playDefaultAlarmSound();
            
            // Charger l'horoscope
            loadHoroscope((wakeUpSettings as any).zodiacSign);
            break;
            
          default:
            playDefaultAlarmSound();
        }
      };
      
      startWakeUpMode();
      
      // Nettoyer les effets sonores et les vibrations à la fermeture
      return () => {
        Vibration.cancel();
        stopRadio();
        stopSpotifyPlayback();
        // Arrêter le son d'alarme par défaut
      };
    }, [alarm])
  );
  
  // Charger l'horoscope
  const loadHoroscope = async (sign: string) => {
    if (!sign) return;
    
    setIsLoadingHoroscope(true);
    
    try {
      // Essayer d'obtenir l'horoscope du cache d'abord
      const cachedHoroscope = await getCachedHoroscope(sign as any);
      setHoroscope(cachedHoroscope);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'horoscope:', error);
      
      try {
        // Essayer d'obtenir l'horoscope de secours
        const fallbackHoroscope = await getHoroscopeWithFallback(sign as any);
        setHoroscope(fallbackHoroscope);
      } catch (fallbackError) {
        console.error('Erreur lors du chargement de l\'horoscope de secours:', fallbackError);
      }
    } finally {
      setIsLoadingHoroscope(false);
    }
  };
  
  // Jouer un son d'alarme par défaut
  const playDefaultAlarmSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        require('../../assets/sounds/gentle-chime.mp3'),
        { shouldPlay: true, isLooping: true }
      );
      
      return sound;
    } catch (error) {
      console.error('Erreur lors de la lecture du son par défaut:', error);
      return null;
    }
  };
  
  // Mettre l'alarme en snooze
  const handleSnooze = async () => {
    if (!alarm || isSnoozed || isDismissed) return;
    
    try {
      setIsSnoozed(true);
      
      // Arrêter les vibrations
      Vibration.cancel();
      
      // Arrêter les sons
      stopRadio();
      stopSpotifyPlayback();
      
      // Mettre l'alarme en snooze
      await snoozeActiveAlarm(alarm.id, SNOOZE_DURATION_MINUTES);
    } catch (error) {
      console.error('Erreur lors de la mise en snooze de l\'alarme:', error);
      setIsSnoozed(false);
    }
  };
  
  // Arrêter l'alarme
  const handleDismiss = async () => {
    if (!alarm || isDismissed) return;
    
    try {
      setIsDismissed(true);
      
      // Arrêter les vibrations
      Vibration.cancel();
      
      // Arrêter les sons
      stopRadio();
      stopSpotifyPlayback();
      
      // Arrêter l'alarme
      await dismissActiveAlarm(alarm.id);
    } catch (error) {
      console.error('Erreur lors de l\'arrêt de l\'alarme:', error);
      setIsDismissed(false);
    }
  };
  
  // Obtenir l'icône et le nom du mode de réveil
  const getModeIcon = () => {
    if (!alarm) return { icon: 'alarm-outline', name: 'Alarme' };
    
    switch (alarm.wakeUpSettings.type) {
      case WakeUpMode.Radio:
        return { icon: 'radio-outline', name: 'Radio' };
      case WakeUpMode.Spotify:
        return { icon: 'musical-notes-outline', name: 'Spotify' };
      case WakeUpMode.Horoscope:
        return { icon: 'star-outline', name: 'Horoscope' };
      default:
        return { icon: 'alarm-outline', name: 'Alarme' };
    }
  };
  
  // Obtenir les couleurs du gradient en fonction du mode de réveil
  const getGradientColors = () => {
    if (!alarm) return [theme.colors.primary, theme.colors.secondary];
    
    switch (alarm.wakeUpSettings.type) {
      case WakeUpMode.Radio:
        return [theme.colors.info, `${theme.colors.info}80`];
      case WakeUpMode.Spotify:
        return ['#1DB954', '#1DB95480'];
      case WakeUpMode.Horoscope:
        return [theme.colors.secondary, `${theme.colors.secondary}80`];
      default:
        return [theme.colors.primary, theme.colors.secondary];
    }
  };
  
  // Rotation pour l'animation
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  
  // Afficher un indicateur de chargement pendant le chargement de l'alarme
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  // Si l'alarme n'est pas trouvée
  if (!alarm) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text>Alarme non trouvée</Text>
      </View>
    );
  }
  
  const { icon, name } = getModeIcon();
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={getGradientColors()}
        style={styles.backgroundGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.contentContainer}>
            <View style={styles.topContent}>
              <Animated.View
                style={{
                  transform: [
                    { scale: pulseAnim },
                  ],
                }}
              >
                <Text style={styles.timeText}>
                  {formatTime(alarm.hour, alarm.minute, TimeFormat.Format24h)}
                </Text>
              </Animated.View>
              
              <Text style={styles.nameText}>{alarm.name}</Text>
              
              <View style={styles.modeContainer}>
                <Ionicons
                  name={icon as any}
                  size={24}
                  color="white"
                  style={styles.modeIcon}
                />
                <Text style={styles.modeText}>{name}</Text>
              </View>
            </View>
            
            <View style={styles.middleContent}>
              {alarm.wakeUpSettings.type === WakeUpMode.Horoscope && (
                <>
                  {isLoadingHoroscope ? (
                    <View style={styles.horoscopeLoading}>
                      <ActivityIndicator size="large" color="white" />
                      <Text style={styles.statusText}>
                        Chargement de votre horoscope...
                      </Text>
                    </View>
                  ) : horoscope ? (
                    <View style={styles.horoscopeContainer}>
                      <Text style={styles.horoscopeTitle}>
                        Votre horoscope du jour
                      </Text>
                      <Text style={styles.horoscopePrediction}>
                        {horoscope.prediction}
                      </Text>
                      <Text style={styles.horoscopeLucky}>
                        Nombre chanceux : {horoscope.lucky.number} • Couleur : {horoscope.lucky.color}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}
            </View>
            
            <View style={styles.bottomContent}>
              {isSnoozed ? (
                <Text style={styles.statusText}>
                  Alarme reportée de {SNOOZE_DURATION_MINUTES} minutes
                </Text>
              ) : isDismissed ? (
                <Text style={styles.statusText}>
                  Alarme arrêtée
                </Text>
              ) : (
                <View style={styles.buttonContainer}>
                  <View style={styles.snoozeButton}>
                    <Button
                      title={`Snooze (${SNOOZE_DURATION_MINUTES} min)`}
                      onPress={handleSnooze}
                      variant="outline"
                      size="large"
                      icon="time-outline"
                      style={{ borderColor: 'white' }}
                      textStyle={{ color: 'white' }}
                    />
                  </View>
                  
                  <View style={styles.dismissButton}>
                    <Button
                      title="Arrêter"
                      onPress={handleDismiss}
                      variant="primary"
                      size="large"
                      icon="checkmark-outline"
                      style={{ backgroundColor: 'white' }}
                      textStyle={{ color: theme.colors.primary }}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
};

export default AlarmRingingScreen;