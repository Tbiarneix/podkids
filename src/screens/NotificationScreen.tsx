import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { COLORS, SPACING } from '../utils/theme';
import { RootStackParamList } from '../types/navigation';

type NotificationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Notification'
>;

type NotificationScreenRouteProp = RouteProp<
  RootStackParamList,
  'Notification'
>;

export const NotificationScreen: React.FC = () => {
  const navigation = useNavigation<NotificationScreenNavigationProp>();
  const route = useRoute<NotificationScreenRouteProp>();
  
  const { type, message, redirectTo } = route.params;
  
  // Rediriger automatiquement après 2 secondes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (redirectTo) {
        // Utiliser un type casting pour éviter les erreurs de TypeScript
        // Cette approche n'est pas idéale mais fonctionne pour notre cas
        (navigation as any).navigate(redirectTo);
      } else {
        navigation.goBack();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [navigation, redirectTo]);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          { backgroundColor: type === 'success' ? COLORS.primary : COLORS.error }
        ]}>
          <Ionicons 
            name={type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
            size={40} 
            color={type === 'success' ? '#000' : '#FFF'} 
          />
        </View>
        
        <Typography 
          variant="body" 
          center 
          style={styles.message}
        >
          {message}
        </Typography>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  message: {
    fontSize: 18,
  },
});
