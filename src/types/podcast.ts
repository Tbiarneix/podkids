export enum EpisodeStatus {
  TO_LISTEN = "to listen",
  LISTENING = "listening",
  LISTENED = "listened"
}

export interface Episode {
  name: string;
  status: EpisodeStatus;
  timestamp: number;
}

export interface Podcast {
  name: string;
  url: string;
  subscription: boolean;
  episodes: Episode[];
}
