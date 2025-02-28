/**
 * Écran de modification d'une alarme existante
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import DaySelector from '../components/DaySelector';
import TimePickerModal from '../components/TimePickerModal';
import Button from '../components/Button';
import { useTheme } from '../hooks/useTheme';
import { useAlarmsManager } from '../hooks/useAlarmsManager';
import { RootStackParamList } from '../navigation/AppNavigator';
import { WeekDay, WakeUpMode, WakeUpSettings, Alarm } from '../types/alarm';
import { TimeFormat, ZODIAC_SIGN_NAMES } from '../utils/constants';
import { formatTime } from '../utils/dateUtils';
import { ZodiacSign } from '../types/alarm';

type NavigationProp = StackNavigationProp<RootStackParamList, 'EditAlarm'>;
type RouteProps = RouteProp<RootStackParamList, 'EditAlarm'>;

const EditAlarmScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { theme, makeStyles } = useTheme();
  const { alarms, editAlarm, removeAlarm } = useAlarmsManager();
  
  const { alarmId } = route.params;
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // États pour les champs du formulaire
  const [name, setName] = useState<string>('');
  const [hour, setHour] = useState<number>(0);
  const [minute, setMinute] = useState<number>(0);
  const [repeatDays, setRepeatDays] = useState<WeekDay[]>([]);
  const [active, setActive] = useState<boolean>(true);
  const [wakeUpMode, setWakeUpMode] = useState<WakeUpMode>(WakeUpMode.Radio);
  
  // États pour les paramètres spécifiques aux modes
  const [radioStationId, setRadioStationId] = useState<string>('');
  const [radioStationName, setRadioStationName] = useState<string>('');
  const [radioStationUrl, setRadioStationUrl] = useState<string>('');
  
  const [spotifyPlaylistId, setSpotifyPlaylistId] = useState<string>('');
  const [spotifyPlaylistName, setSpotifyPlaylistName] = useState<string>('');
  
  const [zodiacSign, setZodiacSign] = useState<ZodiacSign>(ZodiacSign.Aries);
  const [horoscopeSoundId, setHoroscopeSoundId] = useState<string>('');
  
  // États pour les modals
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [showZodiacPicker, setShowZodiacPicker] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  
  // Charger les données de l'alarme
  useEffect(() => {
    const loadAlarm = () => {
      const foundAlarm = alarms.find(a => a.id === alarmId);
      
      if (foundAlarm) {
        setAlarm(foundAlarm);
        setName(foundAlarm.name);
        setHour(foundAlarm.hour);
        setMinute(foundAlarm.minute);
        setRepeatDays(foundAlarm.repeatDays);
        setActive(foundAlarm.active);
        
        const settings = foundAlarm.wakeUpSettings;
        setWakeUpMode(settings.type);
        
        switch (settings.type) {
          case WakeUpMode.Radio:
            setRadioStationId((settings as any).stationId || '');
            setRadioStationName((settings as any).stationName || '');
            setRadioStationUrl((settings as any).stationUrl || '');
            break;
          case WakeUpMode.Spotify:
            setSpotifyPlaylistId((settings as any).playlistId || '');
            setSpotifyPlaylistName((settings as any).playlistName || '');
            break;
          case WakeUpMode.Horoscope:
            setZodiacSign((settings as any).zodiacSign || ZodiacSign.Aries);
            setHoroscopeSoundId((settings as any).soundId || '');
            break;
        }
      } else {
        // Alarme non trouvée, retourner à l'écran précédent
        Alert.alert('Erreur', 'Alarme non trouvée');
        navigation.goBack();
      }
      
      setLoading(false);
    };
    
    loadAlarm();
  }, [alarmId, alarms, navigation]);
  
  const styles = makeStyles((theme) => ({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    scrollContent: {
      padding: theme.spacing.m,
    },
    section: {
      marginBottom: theme.spacing.l,
    },
    sectionTitle: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
      marginBottom: theme.spacing.s,
    },
    timeContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: theme.spacing.m,
      marginBottom: theme.spacing.m,
    },
    timeText: {
      fontSize: theme.typography.fontSize.xxl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.primary,
    },
    inputContainer: {
      marginBottom: theme.spacing.m,
    },
    inputLabel: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    input: {
      backgroundColor: theme.colors.input,
      borderRadius: theme.spacing.xs,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    switchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: theme.spacing.s,
    },
    switchLabel: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text,
    },
    modeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginVertical: theme.spacing.s,
    },
    modeButton: {
      width: '31%',
      paddingVertical: theme.spacing.m,
      paddingHorizontal: theme.spacing.s,
      marginBottom: theme.spacing.s,
      borderRadius: theme.spacing.s,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    modeButtonSelected: {
      borderColor: theme.colors.primary,
    },
    modeIcon: {
      marginBottom: theme.spacing.xs,
    },
    modeText: {
      fontSize: theme.typography.fontSize.xs,
      fontFamily: theme.typography.fontFamily.medium,
      textAlign: 'center',
    },
    radioModeButton: {
      backgroundColor: `${theme.colors.info}20`,
    },
    spotifyModeButton: {
      backgroundColor: '#1DB95420',
    },
    horoscopeModeButton: {
      backgroundColor: `${theme.colors.secondary}20`,
    },
    radioModeText: {
      color: theme.colors.info,
    },
    spotifyModeText: {
      color: '#1DB954',
    },
    horoscopeModeText: {
      color: theme.colors.secondary,
    },
    selectorButton: {
      backgroundColor: theme.colors.input,
      borderRadius: theme.spacing.xs,
      padding: theme.spacing.m,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    selectorText: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.text,
    },
    buttonRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: theme.spacing.xl,
    },
    buttonContainer: {
      marginVertical: theme.spacing.m,
    },
    deleteButton: {
      marginTop: theme.spacing.l,
    },
  }));
  
  // Gérer le changement des jours de répétition
  const handleDayToggle = useCallback((day: WeekDay) => {
    setRepeatDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      } else {
        return [...prev, day];
      }
    });
  }, []);
  
  // Gérer la sélection de l'heure
  const handleTimeSelected = useCallback((selectedHour: number, selectedMinute: number) => {
    setHour(selectedHour);
    setMinute(selectedMinute);
    setShowTimePicker(false);
  }, []);
  
  // Gérer le changement de mode de réveil
  const handleModeChange = useCallback((mode: WakeUpMode) => {
    setWakeUpMode(mode);
  }, []);
  
  // Gérer la sélection du signe du zodiaque
  const handleZodiacSignSelect = useCallback((sign: ZodiacSign) => {
    setZodiacSign(sign);
    setShowZodiacPicker(false);
  }, []);
  
  // Préparer les paramètres de réveil en fonction du mode sélectionné
  const getWakeUpSettings = useCallback((): WakeUpSettings => {
    switch (wakeUpMode) {
      case WakeUpMode.Radio:
        return {
          type: WakeUpMode.Radio,
          stationId: radioStationId || 'default',
          stationName: radioStationName,
          stationUrl: radioStationUrl,
        };
      case WakeUpMode.Spotify:
        return {
          type: WakeUpMode.Spotify,
          playlistId: spotifyPlaylistId || 'default',
          playlistName: spotifyPlaylistName,
        };
      case WakeUpMode.Horoscope:
        return {
          type: WakeUpMode.Horoscope,
          zodiacSign: zodiacSign,
          soundId: horoscopeSoundId || 'gentle-chime',
        };
      default:
        return {
          type: WakeUpMode.Radio,
          stationId: 'default',
          stationName: 'Radio par défaut',
          stationUrl: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
        };
    }
  }, [
    wakeUpMode, 
    radioStationId, 
    radioStationName, 
    radioStationUrl, 
    spotifyPlaylistId, 
    spotifyPlaylistName, 
    zodiacSign, 
    horoscopeSoundId
  ]);
  
  // Enregistrer les modifications
  const handleSave = useCallback(async () => {
    if (!alarm) return;
    
    try {
      setIsSubmitting(true);
      
      // Vérifier que le nom n'est pas vide
      if (!name.trim()) {
        Alert.alert('Erreur', 'Veuillez donner un nom à votre alarme');
        setIsSubmitting(false);
        return;
      }
      
      // Mettre à jour l'alarme
      await editAlarm({
        id: alarm.id,
        name: name.trim(),
        hour,
        minute,
        repeatDays,
        active,
        wakeUpSettings: getWakeUpSettings(),
      });
      
      // Retourner à l'écran principal
      navigation.goBack();
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'alarme:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'alarme. Veuillez réessayer.');
      setIsSubmitting(false);
    }
  }, [
    alarm,
    name, 
    hour, 
    minute, 
    repeatDays, 
    active, 
    getWakeUpSettings, 
    editAlarm, 
    navigation
  ]);
  
  // Supprimer l'alarme
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Supprimer l\'alarme',
      'Êtes-vous sûr de vouloir supprimer cette alarme ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            if (!alarm) return;
            
            try {
              setIsDeleting(true);
              await removeAlarm(alarm.id);
              navigation.goBack();
            } catch (error) {
              console.error('Erreur lors de la suppression de l\'alarme:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'alarme. Veuillez réessayer.');
              setIsDeleting(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [alarm, removeAlarm, navigation]);
  
  // Annuler et retourner à l'écran principal
  const handleCancel = useCallback(() => {
    navigation.goBack();
  }, [navigation]);
  
  // Rendu des options spécifiques au mode de réveil
  const renderModeOptions = () => {
    switch (wakeUpMode) {
      case WakeUpMode.Radio:
        return (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nom de la station</Text>
              <TextInput
                style={styles.input}
                value={radioStationName}
                onChangeText={setRadioStationName}
                placeholder="ex: France Inter"
                placeholderTextColor={theme.colors.textSecondary}
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>URL de la station</Text>
              <TextInput
                style={styles.input}
                value={radioStationUrl}
                onChangeText={setRadioStationUrl}
                placeholder="URL du flux radio"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>
        );
        
      case WakeUpMode.Spotify:
        return (
          <View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Playlist Spotify</Text>
              <TextInput
                style={styles.input}
                value={spotifyPlaylistName}
                onChangeText={setSpotifyPlaylistName}
                placeholder="ex: Morning Playlist"
                placeholderTextColor={theme.colors.textSecondary}
              />
              <Text style={[styles.inputLabel, { marginTop: theme.spacing.xs }]}>
                Note: Nécessite une connexion à votre compte Spotify
              </Text>
            </View>
          </View>
        );
        
      case WakeUpMode.Horoscope:
        return (
          <View>
            <Text style={styles.inputLabel}>Signe du zodiaque</Text>
            <TouchableOpacity
              style={styles.selectorButton}
              onPress={() => setShowZodiacPicker(true)}
            >
              <Text style={styles.selectorText}>
                {ZODIAC_SIGN_NAMES[zodiacSign]}
              </Text>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        );
        
      default:
        return null;
    }
  };
  
  // Afficher un indicateur de chargement pendant le chargement de l'alarme
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Sélecteur d'heure */}
        <TouchableOpacity
          style={styles.timeContainer}
          onPress={() => setShowTimePicker(true)}
        >
          <Text style={styles.timeText}>
            {formatTime(hour, minute, TimeFormat.Format24h)}
          </Text>
        </TouchableOpacity>
        
        {/* Nom de l'alarme */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nom</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nom de l'alarme"
              placeholderTextColor={theme.colors.textSecondary}
            />
          </View>
        </View>
        
        {/* Jours de répétition */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Répétition</Text>
          <DaySelector
            selectedDays={repeatDays}
            onDayPress={handleDayToggle}
          />
        </View>
        
        {/* Mode de réveil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mode de réveil</Text>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                styles.radioModeButton,
                wakeUpMode === WakeUpMode.Radio && styles.modeButtonSelected
              ]}
              onPress={() => handleModeChange(WakeUpMode.Radio)}
            >
              <Ionicons
                name="radio-outline"
                size={24}
                color={theme.colors.info}
                style={styles.modeIcon}
              />
              <Text style={[styles.modeText, styles.radioModeText]}>Radio</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                styles.spotifyModeButton,
                wakeUpMode === WakeUpMode.Spotify && styles.modeButtonSelected
              ]}
              onPress={() => handleModeChange(WakeUpMode.Spotify)}
            >
              <Ionicons
                name="musical-notes-outline"
                size={24}
                color="#1DB954"
                style={styles.modeIcon}
              />
              <Text style={[styles.modeText, styles.spotifyModeText]}>Spotify</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.modeButton,
                styles.horoscopeModeButton,
                wakeUpMode === WakeUpMode.Horoscope && styles.modeButtonSelected
              ]}
              onPress={() => handleModeChange(WakeUpMode.Horoscope)}
            >
              <Ionicons
                name="star-outline"
                size={24}
                color={theme.colors.secondary}
                style={styles.modeIcon}
              />
              <Text style={[styles.modeText, styles.horoscopeModeText]}>Horoscope</Text>
            </TouchableOpacity>
          </View>
          
          {/* Options spécifiques au mode */}
          {renderModeOptions()}
        </View>
        
        {/* Activer/désactiver */}
        <View style={styles.section}>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>Activer</Text>
            <Switch
              value={active}
              onValueChange={setActive}
              trackColor={{ 
                false: theme.colors.border, 
                true: `${theme.colors.primary}80` 
              }}
              thumbColor={
                active 
                  ? theme.colors.primary 
                  : Platform.OS === 'ios' 
                    ? 'white' 
                    : theme.colors.textSecondary
              }
            />
          </View>
        </View>
        
        {/* Boutons */}
        <View style={styles.buttonRow}>
          <View style={{ flex: 1, marginRight: theme.spacing.s }}>
            <Button
              title="Annuler"
              onPress={handleCancel}
              variant="outline"
              size="medium"
            />
          </View>
          <View style={{ flex: 1, marginLeft: theme.spacing.s }}>
            <Button
              title="Enregistrer"
              onPress={handleSave}
              variant="primary"
              size="medium"
              loading={isSubmitting}
              disabled={isSubmitting}
            />
          </View>
        </View>
        
        {/* Bouton de suppression */}
        <View style={styles.deleteButton}>
          <Button
            title="Supprimer l'alarme"
            onPress={handleDelete}
            variant="text"
            size="medium"
            icon="trash-outline"
            loading={isDeleting}
            disabled={isDeleting}
            style={{ backgroundColor: `${theme.colors.error}10` }}
            textStyle={{ color: theme.colors.error }}
          />
        </View>
      </ScrollView>
      
      {/* Modal pour la sélection de l'heure */}
      <TimePickerModal
        visible={showTimePicker}
        initialHour={hour}
        initialMinute={minute}
        onClose={() => setShowTimePicker(false)}
        onTimeSelected={handleTimeSelected}
        timeFormat={TimeFormat.Format24h}
      />
      
      {/* Ici, on pourrait ajouter un modal pour la sélection du signe du zodiaque */}
    </KeyboardAvoidingView>
  );
};

export default EditAlarmScreen;