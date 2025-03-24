export type RootStackParamList = {
  Presentation: undefined;
  PinCode: undefined;
  PinVerification: undefined;
  Settings: { profileCreated?: boolean };
  ModifyPin: undefined;
  Home: undefined;
  PodcastDetails: { podcastId: string };
  AddProfile: undefined;
  Notification: { 
    type: 'success' | 'error';
    message: string;
    redirectTo?: keyof RootStackParamList;
  };
};
