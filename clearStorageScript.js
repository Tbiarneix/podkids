const { StorageUtils } = require('./src/utils/StorageUtils');

// Fonction principale
async function main() {
  console.log('Début du nettoyage d\'AsyncStorage...');
  
  try {
    // Afficher le contenu actuel
    await StorageUtils.debugStorage();
    
    // Vider le stockage
    await StorageUtils.clearAllStorage();
    
    // Vérifier que tout est bien vidé
    const remainingKeys = await StorageUtils.getAllKeys();
    console.log('Clés restantes après nettoyage:', remainingKeys);
    
    console.log('Opération terminée avec succès!');
  } catch (error) {
    console.error('Erreur lors du nettoyage:', error);
  }
}

// Exécuter la fonction principale
main();
