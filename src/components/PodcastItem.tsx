import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Podcast, PodcastSubscription } from '../types/podcast';
import { Typography } from './Typography';
import { COLORS, SPACING } from '../utils/theme';
import { useActiveProfile } from '../contexts/ActiveProfileContext';

interface PodcastItemProps {
  podcast: Podcast;
  onPress: (podcast: Podcast) => void;
  onToggleSubscription: (podcastId: string) => void;
  showThemeTag?: boolean;
  showEpisodeCount?: boolean;
}

export const PodcastItem: React.FC<PodcastItemProps> = ({
  podcast,
  onPress,
  onToggleSubscription,
  showThemeTag = true,
  showEpisodeCount = false
}) => {
  const { activeProfile } = useActiveProfile();
  
  // Vérifier si le profil actif est abonné à ce podcast
  const isSubscribed = podcast.subscription?.some(
    sub => sub.profileId === activeProfile?.id && sub.subscription
  ) || false;

  return (
    <TouchableOpacity 
      style={styles.podcastItem}
      onPress={() => onPress(podcast)}
    >
      <Image 
        source={{ uri: podcast.cover || 'https://via.placeholder.com/150' }}
        style={styles.podcastCover}
      />
      <View style={styles.podcastInfo}>
        <Typography variant="subtitle" numberOfLines={1} style={styles.podcastName}>
          {podcast.name}
        </Typography>
        <Typography variant="caption" numberOfLines={1} style={styles.podcastAuthor}>
          {podcast.author || 'Auteur inconnu'}
        </Typography>
        
        {showEpisodeCount && (
          <Typography variant="caption" style={styles.episodeCount}>
            {podcast.episodes.length} épisodes
          </Typography>
        )}
        
        <View style={styles.tagsContainer}>
          <TouchableOpacity 
            style={[
              styles.subscriptionTag, 
              isSubscribed ? styles.subscribedTag : {}
            ]}
            onPress={() => onToggleSubscription(podcast.id)}
          >
            <Typography 
              variant="caption" 
              style={[
                styles.tagText, 
                isSubscribed ? styles.subscribedTagText : {}
              ]}
            >
              {isSubscribed ? 'Abonné' : 'S\'abonner'}
            </Typography>
          </TouchableOpacity>
          
          {showThemeTag && (
            <View style={styles.themeTag}>
              <Typography variant="caption" style={styles.tagText}>
                {podcast.types && podcast.types.length > 0 ? podcast.types[0] : 'Général'}
              </Typography>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  podcastItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: SPACING.md,
    padding: SPACING.sm,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  podcastCover: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  podcastInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  podcastName: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  podcastAuthor: {
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  episodeCount: {
    color: COLORS.textSecondary,
    marginBottom: 4,
    fontSize: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: 'auto',
  },
  subscriptionTag: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  subscribedTag: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  themeTag: {
    backgroundColor: COLORS.tertiary,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: COLORS.primary,
    fontSize: 10,
  },
  subscribedTagText: {
    color: COLORS.text,
  },
});
