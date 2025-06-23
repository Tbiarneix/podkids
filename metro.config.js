// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Ajout de résolution pour les problèmes de PlatformConstants
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  // Assurez-vous que ces modules sont correctement résolus
  'expo-constants': require.resolve('expo-constants'),
};

// Ajout de configuration pour éviter les problèmes de cache
config.resetCache = true;

module.exports = config;
