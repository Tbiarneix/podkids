import React from 'react';
import { View, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import { Typography } from '../components/Typography';
import { Button } from '../components/Button';
import { COLORS, SPACING } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';

type PresentationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Presentation'
>;

export const PresentationScreen: React.FC = () => {
  const navigation = useNavigation<PresentationScreenNavigationProp>();

  const handleUnderstand = () => {
    // Navigation vers l'écran principal sera implémentée plus tard
    console.log('Compris !');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Typography variant="title" center>
            Présentation
          </Typography>
          
          <Typography variant="body" style={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
            ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
            laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
            velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
            sunt in culpa qui officia deserunt mollit anim id est laborum.
          </Typography>
          
          <Typography variant="body" style={styles.paragraph}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt
            ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco
            laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate
            velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident,
            sunt in culpa qui officia deserunt mollit anim id est laborum.
          </Typography>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button 
          title="J'ai compris" 
          onPress={handleUnderstand}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  paragraph: {
    marginBottom: SPACING.lg,
  },
  footer: {
    padding: SPACING.xl,
    paddingBottom: SPACING.xl * 1.5,
  },
});
