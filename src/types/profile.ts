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
