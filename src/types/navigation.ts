export type RootStackParamList = {
  Presentation: undefined;
  PinCode: undefined;
  PinVerification: undefined;
  Settings: { profileCreated?: boolean; podcastAdded?: boolean };
  ModifyPin: undefined;
  Home: { profileId?: string };
  PodcastDetails: { podcastId: string };
  AddProfile: undefined;
  EditProfile: { profileId: string };
  ChangeProfile: { initialProfileId?: string };
  Notification: { 
    type: 'success' | 'error';
    message: string;
    redirectTo?: keyof RootStackParamList;
  };
  AddPodcast: undefined;
  PodcastError: { 
    errorType: string; 
    errorMessage: string 
  };
  PodcastSuccess: { 
    podcastName: string 
  };
};
