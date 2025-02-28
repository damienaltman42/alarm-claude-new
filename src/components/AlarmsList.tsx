/**
 * Composant pour afficher la liste des alarmes
 */

import React, { useCallback } from 'react';
import { 
  View, 
  FlatList, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import AlarmCard from './AlarmCard';
import { AlarmInfo } from '../hooks/useAlarmsManager';
import { useTheme } from '../hooks/useTheme';

interface AlarmsListProps {
  alarms: AlarmInfo[];
  loading: boolean;
  onToggleAlarm: (id: string, active: boolean) => void;
  onRefresh: () => void;
  nextAlarmId?: string | null;
}

const AlarmsList: React.FC<AlarmsListProps> = ({ 
  alarms, 
  loading, 
  onToggleAlarm,
  onRefresh,
  nextAlarmId 
}) => {
  const { theme, makeStyles } = useTheme();
  
  const styles = makeStyles((theme) => ({
    container: {
      flex: 1,
    },
    listContent: {
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.xl,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyText: {
      fontSize: theme.typography.fontSize.m,
      fontFamily: theme.typography.fontFamily.medium,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.m,
    },
    emptySubText: {
      fontSize: theme.typography.fontSize.s,
      fontFamily: theme.typography.fontFamily.regular,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: theme.spacing.s,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    separator: {
      height: theme.spacing.s,
    },
    listFooter: {
      height: 100, // Espace en bas pour éviter que le FAB ne cache des éléments
    },
  }));
  
  // Rendu d'un élément de la liste
  const renderItem = useCallback(({ item }: { item: AlarmInfo }) => {
    const isNext = item.id === nextAlarmId;
    
    return (
      <AlarmCard 
        alarm={item} 
        onToggle={onToggleAlarm}
        isNext={isNext}
      />
    );
  }, [onToggleAlarm, nextAlarmId]);
  
  // Génération d'une clé unique pour chaque élément
  const keyExtractor = useCallback((item: AlarmInfo) => item.id, []);
  
  // Séparateur entre les éléments
  const ItemSeparator = useCallback(() => <View style={styles.separator} />, [styles]);
  
  // Affichage lorsque la liste est vide
  const renderEmptyComponent = useCallback(() => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      );
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Vous n'avez pas encore d'alarmes
        </Text>
        <Text style={styles.emptySubText}>
          Appuyez sur le bouton "+" pour créer votre première alarme
        </Text>
      </View>
    );
  }, [loading, styles, theme]);
  
  // Footer de la liste
  const renderFooter = useCallback(() => <View style={styles.listFooter} />, [styles]);
  
  return (
    <View style={styles.container}>
      <FlatList
        data={alarms}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={ItemSeparator}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      />
    </View>
  );
};

export default AlarmsList;