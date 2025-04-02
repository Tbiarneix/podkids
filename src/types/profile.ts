import { AgeRange, PodcastType } from './podcast';

export interface Profile {
  id: string;
  name: string;
  avatar: number;
  ageRanges: AgeRange[];
  createdAt: number;
  updatedAt: number;
}

export interface ProfileFormData {
  name: string;
  avatar: number;
  ageRanges: AgeRange[];
}

export interface ActiveProfileContextType {
  activeProfile: Profile | null;
  setActiveProfile: (profile: Profile | null) => void;
  loadProfile: (profileId: string) => Promise<void>;
  clearActiveProfile: () => void;
  isLoading: boolean;
}
