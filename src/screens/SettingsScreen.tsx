/**
 * Écran des paramètres de l'application
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';

import Button from '../components/Button';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import { loadUserPreferences, saveUserPreferences, clearAllData } from '../services/storageService';
import { TimeFormat, ZODIAC_SIGN_NAMES, ZodiacSign, DEFAULT_ALARM_SOUNDS } from '../utils/constants';
import { isAuthenticated, logout } from '../services/spotifyService';

const SettingsScreen: React.FC = () => {
  const { theme, makeStyles, isDark, toggleTheme } = useTheme();
  const { permissions, checkPermissions } = useNotifications();
  
  // États locaux pour les préférences utilisateur
  const [timeFormat, setTimeFormat] = useState<TimeFormat>(TimeFormat.Format24h);
  const [zodiacSign, setZodiacSign] = useState<ZodiacSign | undefined>(undefined);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(true);
  const [snoozeDuration, setSnoozeDuration] = useState<number>(9);
  const [isSpotifyConnected, setIsSpotifyConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const styles = makeStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      padding: theme.spacing.m,
    },
    section: {
      marginBottom: theme.spacing.xl,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.s,
    },
    settingRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.m,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    lastSettingRow: {
      borderBottomWidth: 0,
    },
    settingLabel: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
    },
    valueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    valueText: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      marginRight: theme.spacing.s,
    },
    connectionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.s,
      borderRadius: theme.spacing.xs,
      backgroundColor: isSpotifyConnected ? '#1DB954' : theme.colors.primary,
    },
    connectionButtonText: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textLight,
      marginLeft: theme.spacing.xs,
    },
    versionContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.xl,
      marginBottom: theme.spacing.m,
    },
    versionText: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
    },
    dangerSection: {
      marginTop: theme.spacing.xl,
    },
    dangerButton: {
      backgroundColor: `${theme.colors.error}10`,
    },
    dangerButtonText: {
      color: theme.colors.error,
    },
  }));
  
  // Charger les préférences au démarrage
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const prefs = await loadUserPreferences();
        
        setTimeFormat(prefs.timeFormat as TimeFormat || TimeFormat.Format24h);
        setZodiacSign(prefs.zodiacSign as ZodiacSign || undefined);
        setSoundEnabled(prefs.soundEnabled !== undefined ? prefs.soundEnabled : true);
        setVibrationEnabled(prefs.vibrationEnabled !== undefined ? prefs.vibrationEnabled : true);
        setSnoozeDuration(prefs.snoozeDuration || 9);
        
        // Vérifier l'état de connexion à Spotify
        const spotifyConnected = await isAuthenticated();
        setIsSpotifyConnected(spotifyConnected);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Erreur lors du chargement des préférences:', error);
        setIsLoading(false);
      }
    };
    
    loadPreferences();
  }, []);
  
  // Sauvegarder une préférence lorsqu'elle change
  const savePreference = useCallback(async <T extends keyof UserPreferences>(
    key: T,
    value: UserPreferences[T]
  ) => {
    try {
      const prefs = await loadUserPreferences();
      await saveUserPreferences({
        ...prefs,
        [key]: value,
      });
    } catch (error) {
      console.error(`Erreur lors de la sauvegarde de la préférence ${key}:`, error);
    }
  }, []);
  
  // Gérer le changement de format d'heure
  const handleTimeFormatChange = useCallback(() => {
    const newFormat = timeFormat === TimeFormat.Format24h
      ? TimeFormat.Format12h
      : TimeFormat.Format24h;
    
    setTimeFormat(newFormat);
    savePreference('timeFormat', newFormat);
    
    // Retour haptique sur iOS
    if (Platform.OS === 'ios') {
      Haptics.selectionAsync();
    }
  }, [timeFormat, savePreference]);
  
  // Gérer l'activation/désactivation du son
  const handleSoundToggle = useCallback((value: boolean) => {
    setSoundEnabled(value);
    savePreference('soundEnabled', value);
  }, [savePreference]);
  
  // Gérer l'activation/désactivation des vibrations
  const handleVibrationToggle = useCallback((value: boolean) => {
    setVibrationEnabled(value);
    savePreference('vibrationEnabled', value);
  }, [savePreference]);
  
  // Gérer le changement de durée du snooze
  const handleSnoozeDurationChange = useCallback(() => {
    // Options pour la durée du snooze (en minutes)
    const options = [5, 9, 10, 15, 20];
    
    Alert.alert(
      'Durée du Snooze',
      'Choisissez une durée (en minutes)',
      options.map(duration => ({
        text: `${duration} minutes`,
        onPress: () => {
          setSnoozeDuration(duration);
          savePreference('snoozeDuration', duration);
        },
        style: duration === snoozeDuration ? 'cancel' : 'default',
      })),
      { cancelable: true }
    );
  }, [snoozeDuration, savePreference]);
  
  // Gérer la sélection du signe astrologique
  const handleZodiacSignChange = useCallback(() => {
    const signs = Object.values(ZodiacSign);
    
    Alert.alert(
      'Signe Astrologique',
      'Choisissez votre signe',
      signs.map(sign => ({
        text: ZODIAC_SIGN_NAMES[sign],
        onPress: () => {
          setZodiacSign(sign);
          savePreference('zodiacSign', sign);
        },
        style: sign === zodiacSign ? 'cancel' : 'default',
      })),
      { cancelable: true }
    );
  }, [zodiacSign, savePreference]);
  
  // Gérer la connexion/déconnexion Spotify
  const handleSpotifyConnection = useCallback(async () => {
    if (isSpotifyConnected) {
      // Déconnexion
      try {
        await logout();
        setIsSpotifyConnected(false);
        Alert.alert('Succès', 'Déconnecté de Spotify');
      } catch (error) {
        console.error('Erreur lors de la déconnexion de Spotify:', error);
        Alert.alert('Erreur', 'Impossible de se déconnecter de Spotify');
      }
    } else {
      // Connexion - Cette logique serait gérée dans le service Spotify réel
      Alert.alert(
        'Connexion Spotify',
        'Cette fonctionnalité nécessite un compte Spotify Premium. Vous serez redirigé vers la page de connexion.',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Connecter',
            onPress: async () => {
              // Dans une implémentation réelle, on appellerait authenticateWithSpotify()
              // Pour cet exemple, on simule juste la connexion
              setTimeout(() => {
                setIsSpotifyConnected(true);
                Alert.alert('Succès', 'Connecté à Spotify');
              }, 1000);
            },
          },
        ],
        { cancelable: true }
      );
    }
  }, [isSpotifyConnected]);
  
  // Vérifier et demander les permissions de notification
  const handleCheckNotificationPermissions = useCallback(async () => {
    const { granted } = await checkPermissions();
    
    if (granted) {
      Alert.alert('Permissions', 'Les permissions de notification sont accordées.');
    } else {
      Alert.alert(
        'Permissions manquantes',
        'Les permissions de notification sont nécessaires pour les alarmes. Voulez-vous les activer dans les paramètres ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Paramètres',
            onPress: () => {
              // Ouvrir les paramètres de l'application
              Linking.openSettings();
            },
          },
        ],
        { cancelable: true }
      );
    }
  }, [checkPermissions]);
  
  // Réinitialiser toutes les données
  const handleResetAllData = useCallback(() => {
    Alert.alert(
      'Réinitialiser toutes les données',
      'Êtes-vous sûr de vouloir réinitialiser toutes les données ? Cette action est irréversible.',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              Alert.alert('Succès', 'Toutes les données ont été réinitialisées.');
              
              // Recharger les préférences par défaut
              setTimeFormat(TimeFormat.Format24h);
              setZodiacSign(undefined);
              setSoundEnabled(true);
              setVibrationEnabled(true);
              setSnoozeDuration(9);
              setIsSpotifyConnected(false);
            } catch (error) {
              console.error('Erreur lors de la réinitialisation des données:', error);
              Alert.alert('Erreur', 'Impossible de réinitialiser les données.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, []);
  
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Apparence */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Apparence</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Mode sombre</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ 
              false: theme.colors.border, 
              true: `${theme.colors.primary}80` 
            }}
            thumbColor={
              isDark 
                ? theme.colors.primary 
                : Platform.OS === 'ios' 
                  ? 'white' 
                  : theme.colors.textSecondary
            }
          />
        </View>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleTimeFormatChange}
        >
          <View>
            <Text style={styles.settingLabel}>Format d'heure</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>
              {timeFormat === TimeFormat.Format24h ? '24h' : '12h'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Alarmes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Alarmes</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Son</Text>
            <Text style={styles.settingDescription}>Activer le son pour les alarmes</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ 
              false: theme.colors.border, 
              true: `${theme.colors.primary}80` 
            }}
            thumbColor={
              soundEnabled 
                ? theme.colors.primary 
                : Platform.OS === 'ios' 
                  ? 'white' 
                  : theme.colors.textSecondary
            }
          />
        </View>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Vibration</Text>
            <Text style={styles.settingDescription}>Activer la vibration pour les alarmes</Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={handleVibrationToggle}
            trackColor={{ 
              false: theme.colors.border, 
              true: `${theme.colors.primary}80` 
            }}
            thumbColor={
              vibrationEnabled 
                ? theme.colors.primary 
                : Platform.OS === 'ios' 
                  ? 'white' 
                  : theme.colors.textSecondary
            }
          />
        </View>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleSnoozeDurationChange}
        >
          <View>
            <Text style={styles.settingLabel}>Durée du snooze</Text>
            <Text style={styles.settingDescription}>Temps de report d'une alarme</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>{snoozeDuration} minutes</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleCheckNotificationPermissions}
        >
          <View>
            <Text style={styles.settingLabel}>Permissions de notification</Text>
            <Text style={styles.settingDescription}>
              {permissions.granted 
                ? 'Permissions accordées' 
                : 'Permissions nécessaires pour les alarmes'}
            </Text>
          </View>
          <View style={styles.valueContainer}>
            <Ionicons
              name={permissions.granted ? "checkmark-circle" : "alert-circle"}
              size={20}
              color={permissions.granted ? theme.colors.success : theme.colors.warning}
            />
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
              style={{ marginLeft: theme.spacing.s }}
            />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Mode Horoscope */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode Horoscope</Text>
        
        <TouchableOpacity 
          style={styles.settingRow}
          onPress={handleZodiacSignChange}
        >
          <View>
            <Text style={styles.settingLabel}>Signe astrologique</Text>
            <Text style={styles.settingDescription}>Utilisé pour le mode de réveil Horoscope</Text>
          </View>
          <View style={styles.valueContainer}>
            <Text style={styles.valueText}>
              {zodiacSign ? ZODIAC_SIGN_NAMES[zodiacSign] : 'Non défini'}
            </Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={theme.colors.textSecondary}
            />
          </View>
        </TouchableOpacity>
      </View>
      
      {/* Intégrations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Intégrations</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Compte Spotify</Text>
            <Text style={styles.settingDescription}>Connexion pour le mode de réveil Spotify</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.connectionButton,
              { backgroundColor: isSpotifyConnected ? '#1DB954' : theme.colors.primary }
            ]}
            onPress={handleSpotifyConnection}
          >
            <Ionicons
              name={isSpotifyConnected ? "log-out-outline" : "log-in-outline"}
              size={16}
              color="white"
            />
            <Text style={styles.connectionButtonText}>
              {isSpotifyConnected ? 'Déconnecter' : 'Connecter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Réinitialisation */}
      <View style={[styles.section, styles.dangerSection]}>
        <Text style={styles.sectionTitle}>Réinitialisation</Text>
        
        <Button
          title="Réinitialiser toutes les données"
          onPress={handleResetAllData}
          variant="text"
          size="medium"
          icon="trash-outline"
          style={styles.dangerButton}
          textStyle={styles.dangerButtonText}
        />
      </View>
      
      {/* Information de version */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>
          AuroraWake v{Constants.manifest?.version || '1.0.0'}
        </Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;