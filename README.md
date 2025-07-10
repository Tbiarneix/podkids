# podKids

Une application mobile de podcasts pour enfants qui permet aux parents et aux enfants de découvrir et gérer des flux de podcasts adaptés à différentes tranches d'âge.

## Fonctionnalités

### Interface Utilisateur
- Écran de chargement animé avec logo et typographie "podKids"
- Splash screen de 3 secondes à chaque démarrage de l'application
- Interface intuitive et adaptée aux enfants avec thème sombre bleu marine et accents jaunes
- Système de notifications toast pour les messages d'erreur et de succès (disparaissant après 3 secondes)

### Contrôle Parental
- Système de code PIN à 5 chiffres pour le contrôle parental (stocké de manière sécurisée avec SHA-256)
- Écrans pour définir et vérifier le code PIN

### Gestion des Profils
- Création de profils utilisateurs personnalisés avec nom et avatar
- Sélection de tranches d'âge multiples (0-3 ans, 3-6 ans, etc.)
- Sélection de thématiques de podcasts préférées (Histoires, Musiques, etc.)
- Filtrage des podcasts selon l'âge du profil

### Gestion des Podcasts
- Découverte de podcasts par thématique (Histoires, Musiques, Sciences, etc.)
- Vue "Tous les podcasts" pour découvrir l'ensemble des contenus disponibles
- Abonnement aux podcasts préférés
- Stockage optimisé des podcasts et épisodes (métadonnées séparées des épisodes)
- Chargement adaptatif des épisodes pour optimiser les performances
- Suivi de la progression d'écoute des épisodes

### Playlists
- Création et gestion de playlists personnalisées
- Ajout d'épisodes de podcasts aux playlists
- Suppression d'épisodes des playlists

### Gestion des Données
- Stockage local des données sur l'appareil avec AsyncStorage
- Import/export des paramètres au format JSON
- Réinitialisation de l'application

### Fonctionnalité de Date d'Expiration
- Système de vérification de date avec redirection vers un écran d'expiration après le 1er septembre 2027
- Écran d'expiration avec message personnalisé, logo et lien vers le site officiel
- Système de retour utilisateur (feedback) intégré à l'écran d'expiration

## Technologies Utilisées

- React Native
- Expo SDK
- TypeScript
- React Navigation pour la navigation entre écrans
- AsyncStorage pour le stockage local
- Animated API pour les animations
- expo-crypto pour le hashage sécurisé

## Structure des Données

### Structure d'un Podcast
```typescript
{
  id: string;
  name: string;
  description: string;
  cover: string;
  url: string;
  author: string;
  types: PodcastType[];
  ageRanges: AgeRange[];
  subscription: boolean;
  episodes: Episode[];
  deleteable: boolean;
  episodeCount?: number;
  hasEpisodesStored?: boolean;
}
```

### Structure d'un Épisode
```typescript
{
  id: string;
  name: string;
  description: string;
  cover: string;
  url: string;
  duration: number;
  status: "to listen" | "listening" | "listened";
  timestamp: number;
  publicationDate: number;
}
```

### Structure d'une Playlist
```typescript
{
  id: string;
  name: string;
  episodes: Episode[];
  deleteable: boolean;
}
```

### Structure d'un Profil
```typescript
{
  id: string;
  name: string;
  avatar: number;
  ageRanges: AgeRange[];
}
```

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer l'application en mode développement
npx expo start
```

## Build

### APK pour Android

Plusieurs méthodes sont disponibles :

1. Utiliser Expo Go pour tester rapidement :
```bash
npx expo start
```
Puis scanner le QR code avec l'application Expo Go.

2. Utiliser EAS Build (service cloud d'Expo) :
```bash
npx eas build --platform android --profile preview
```

## Optimisations

- Chargement adaptatif des podcasts pour éviter les problèmes de mémoire
- Séparation des métadonnées et des épisodes pour une meilleure performance
- Stockage individuel des podcasts pour éviter les limitations d'AsyncStorage
- Conversion à la demande des durées d'épisodes
- Parseur RSS personnalisé pour éviter les dépendances vulnérables

## Crédits

Application développée pour offrir une expérience sécurisée et adaptée aux enfants pour la découverte de podcasts éducatifs et divertissants.
