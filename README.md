# Podkids

Une application mobile de podcasts pour enfants qui permet aux parents de gérer les différents flux de podcasts accessibles.

## Fonctionnalités

- Gestion des podcasts pour enfants
- Stockage local des données sur l'appareil
- Import/export des données au format JSON
- Interface utilisateur intuitive et adaptée aux enfants

## Technologies utilisées

- React Native
- Expo
- TypeScript
- React Navigation
- Expo Secure Store pour le stockage local

## Installation

```bash
# Installer les dépendances
npm install

# Démarrer l'application
npm start
```

## Structure des données

```typescript
{
  name: "nom du podcast",
  url: "url du flux",
  subscription: boolean,
  episodes: [
    {
      name: "nom de l'épisode",
      status: "to listen" | "listening" | "listened",
      timestamp: number
    }
  ]
}
```

## Développement

L'application utilise une bibliothèque de composants réutilisables pour une meilleure maintenabilité et cohérence visuelle.

## Build

Pour construire la version apk :

`eas build --platform android --profile preview`

