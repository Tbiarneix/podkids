export type RootStackParamList = {
  Presentation: undefined;
  PinCode: undefined;
  PinVerification: undefined;
  Settings: { profileCreated?: boolean; podcastAdded?: boolean; podcastUpdated?: boolean; podcastDeleted?: boolean };
  ModifyPin: undefined;
  Home: { profileId?: string };
  PodcastDetails: { podcastId: string };
  EpisodeDetails: { podcastId: string; episodeId: string };
  AddProfile: undefined;
  EditProfile: { profileId: string };
  ChangeProfile: { initialProfileId?: string };
  HomeProfile: { profileId: string };
  ThemePodcasts: { theme: string; profileId: string };
  Notification: { 
    type: 'success' | 'error';
    message: string;
    redirectTo?: keyof RootStackParamList;
  };
  AddPodcast: undefined;
  PodcastList: undefined;
  EditPodcast: { podcastId: string };
  PodcastError: { 
    errorType: string; 
    errorMessage: string 
  };
  PodcastSuccess: { 
    podcastName: string 
  };
  Library: { profileId: string };
};
