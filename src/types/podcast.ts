export enum EpisodeStatus {
  TO_LISTEN = "to listen",
  LISTENING = "listening",
  LISTENED = "listened"
}

export enum PodcastType {
  STORIES = "Histoires et Contes",
  HISTORY = "Histoire",
  MUSIC = "Musiques et Comptines",
  NATURE = "Natures et Animaux",
  SCIENCE = "Science et Esprit critique",
  KNOWLEDGE = "Culture générale",
  ADVENTURE = "Aventures et Mystères",
  CULTURE = "Culture et Traditions",
  PERSONAL_DEVELOPMENT = "Développement personnel et Emotions",
  ART = "Art et Créativité",
  SPORT = "Sport et Santé",
  TECHNOLOGY = "Technologies et Innovation",
  TRAVEL = "Voyages et Découvertes",
  LANGUAGES = "Langues et Cultures étrangères",
  GAMES = "Jeux et divertissement",
  HEROES = "Héros et Légendes",
  SOCIETY = "Société, actualités et Informations",
  ENTERTAINMENT = "Amusement et divertissement"
}

export enum PodcastTypeDescription {
  STORIES = "Contes de fées, histoires classiques, récits imaginaires et contes pour le coucher",
  HISTORY = "Contenus éducatifs sur l'histoire",
  MUSIC = "Chansons pour enfants, comptines et apprentissage de la musique",
  NATURE = "Histoires sur les animaux, les plantes, l'écologie et les aventures dans la nature",
  SCIENCE = "Explications simplifiées des concepts scientifiques, expériences amusantes et découvertes fascinantes",
  KNOWLEDGE = "Informations générales et petites curiosités pour mieux comprendre le monde",
  ADVENTURE = "Histoires d'aventures, de détectives, de mystères et d'explorations",
  CULTURE = "Documentaires sur les différentes cultures, traditions, fêtes et coutumes du monde entier",
  PERSONAL_DEVELOPMENT = "Discussions sur les émotions, la confiance en soi, l'amitié et la gestion des conflits",
  ART = "Activités créatives, arts plastiques, bricolage, et histoires inspirantes sur des artistes",
  SPORT = "Présentation de différents sports, conseils pour rester actif et histoires inspirantes d'athlètes jeunes",
  TECHNOLOGY = "Introduction aux nouvelles technologies, robots, programmation pour enfants et innovations scientifiques adaptées aux jeunes",
  TRAVEL = "Récits de voyages, découvertes de pays et cultures, cartes géographiques et curiosités du monde",
  LANGUAGES = "Apprentissage de nouvelles langues, contes et histoires en langues étrangères, et exploration des cultures du monde entier",
  GAMES = "Discussions sur les jeux de société, les jeux vidéo adaptés aux enfants et les activités de récréation et loisirs",
  HEROES = "Histoires de héros célèbres, légendes mythologiques, super-héros et personnages historiques inspirants",
  SOCIETY = "Pour mieux comprendre la société et décortiquer les actualités et les informations du quotidien",
  ENTERTAINMENT = "Emissions de divertissement, de loisirs et de récréation"
}

export enum AgeRange {
  UNDER_3 = "under 3",
  BETWEEN_4_AND_6 = "between 4 and 6",
  BETWEEN_7_AND_9 = "between 7 and 9",
  BETWEEN_10_AND_12 = "between 10 and 12",
  BETWEEN_13_AND_15 = "between 13 and 15",
  OVER_15 = "over 15"
}

export interface Episode {
  id: string;
  name: string;
  description: string;
  cover: string;
  url: string;
  duration: number;
  status: EpisodeStatus;
  timestamp: number;
  publicationDate: number;
}

export interface Podcast {
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
}

export interface Playlist {
  id: string;
  name: string;
  episodes: Episode[];
  deleteable: boolean;
}
