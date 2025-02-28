/**
 * Composant de modal pour sélectionner l'heure de l'alarme
 */

import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  TouchableOpacity, 
  StyleSheet, 
  Platform 
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '../hooks/useTheme';
import { formatTime } from '../utils/dateUtils';
import { TimeFormat } from '../utils/constants';

interface TimePickerModalProps {
  visible: boolean;
  initialHour: number;
  initialMinute: number;
  onClose: () => void;
  onTimeSelected: (hour: number, minute: number) => void;
  timeFormat?: TimeFormat;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  initialHour,
  initialMinute,
  onClose,
  onTimeSelected,
  timeFormat = TimeFormat.Format24h
}) => {
  const { theme, makeStyles, isDark } = useTheme();
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(Platform.OS === 'ios');
  
  // Initialiser la date avec les valeurs initiales
  useEffect(() => {
    if (visible) {
      const newDate = new Date();
      newDate.setHours(initialHour, initialMinute, 0, 0);
      setDate(newDate);
      
      // Sur Android, afficher le picker directement
      if (Platform.OS === 'android') {
        setShow(true);
      }
    }
  }, [visible, initialHour, initialMinute]);
  
  const styles = makeStyles((theme) => ({
    centeredView: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
      width: '80%',
      backgroundColor: theme.colors.card,
      borderRadius: theme.spacing.m,
      padding: theme.spacing.l,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.m,
    },
    title: {
      fontSize: theme.typography.fontSize.l,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.text,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    content: {
      alignItems: 'center',
      marginVertical: theme.spacing.m,
    },
    timeDisplay: {
      fontSize: theme.typography.fontSize.xxl,
      fontFamily: theme.typography.fontFamily.bold,
      color: theme.colors.primary,
      marginBottom: theme.spacing.m,
    },
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: theme.spacing.m,
    },
    button: {
      paddingHorizontal: theme.spacing.m,
      paddingVertical: theme.spacing.s,
      borderRadius: theme.spacing.s,
      marginLeft: theme.spacing.s,
    },
    cancelButton: {
      backgroundColor: 'transparent',
    },
    confirmButton: {
      backgroundColor: theme.colors.primary,
    },
    cancelText: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
    },
    confirmText: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textLight,
    },
    pickerContainer: {
      alignItems: 'center',
      width: '100%',
    },
  }));
  
  // Gérer le changement d'heure
  const onChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
      if (event.type === 'dismissed') {
        // L'utilisateur a annulé la sélection
        onClose();
        return;
      }
    }
    
    if (selectedDate) {
      setDate(selectedDate);
    }
  };
  
  // Confirmer la sélection
  const handleConfirm = () => {
    onTimeSelected(date.getHours(), date.getMinutes());
    onClose();
  };
  
  // Annuler la sélection
  const handleCancel = () => {
    onClose();
  };
  
  if (!visible) {
    return null;
  }
  
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={handleCancel}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          {Platform.OS === 'ios' && (
            <>
              <View style={styles.header}>
                <Text style={styles.title}>Choisir l'heure</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleCancel}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={theme.colors.text}
                  />
                </TouchableOpacity>
              </View>
              
              <View style={styles.content}>
                <Text style={styles.timeDisplay}>
                  {formatTime(date.getHours(), date.getMinutes(), timeFormat)}
                </Text>
                
                <View style={styles.pickerContainer}>
                  {show && (
                    <DateTimePicker
                      testID="dateTimePicker"
                      value={date}
                      mode="time"
                      is24Hour={timeFormat === TimeFormat.Format24h}
                      display="spinner"
                      onChange={onChange}
                      themeVariant={isDark ? 'dark' : 'light'}
                      locale="fr-FR"
                    />
                  )}
                </View>
              </View>
              
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          
          {Platform.OS === 'android' && show && (
            <DateTimePicker
              testID="dateTimePicker"
              value={date}
              mode="time"
              is24Hour={timeFormat === TimeFormat.Format24h}
              display="default"
              onChange={onChange}
              themeVariant={isDark ? 'dark' : 'light'}
              locale="fr-FR"
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

export default TimePickerModal;