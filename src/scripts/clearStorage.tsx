import React, { useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { StorageUtils } from '../utils/StorageUtils';

/**
 * Composant utilitaire pour effacer le stockage AsyncStorage
 */
export const ClearStorageScreen: React.FC = () => {
  // Afficher le contenu actuel au chargement
  useEffect(() => {
    const showCurrentStorage = async () => {
      await StorageUtils.debugStorage();
    };
    
    showCurrentStorage();
  }, []);

  const handleClearStorage = async () => {
    try {
      await StorageUtils.clearAllStorage();
      // Afficher les clés après nettoyage pour confirmer
      const remainingKeys = await StorageUtils.getAllKeys();
      console.log('Clés restantes après nettoyage:', remainingKeys);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Utilitaire de nettoyage AsyncStorage</Text>
      <Text style={styles.subtitle}>Cet écran permet de vider complètement AsyncStorage</Text>
      <Text style={styles.warning}>⚠️ Attention: Cette action est irréversible!</Text>
      <Button 
        title="Vider AsyncStorage" 
        onPress={handleClearStorage} 
        color="#FF3B30"
      />
      <Text style={styles.info}>Vérifiez la console pour voir les détails</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#001D3D',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#FFC107',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#fff',
  },
  warning: {
    fontSize: 18,
    color: '#FF3B30',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  info: {
    marginTop: 20,
    color: '#8E8E93',
    fontSize: 14,
  }
});
