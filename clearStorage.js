// Script pour vider AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage';

const clearAllStorage = async () => {
  try {
    console.log('Début du nettoyage d\'AsyncStorage...');
    await AsyncStorage.clear();
    console.log('AsyncStorage a été complètement vidé avec succès!');
  } catch (error) {
    console.error('Erreur lors du nettoyage d\'AsyncStorage:', error);
  }
};

// Exécuter la fonction de nettoyage
clearAllStorage();
