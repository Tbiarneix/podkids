import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image } from 'react-native';
import { Podcast } from '../types/podcast';
import { Typography } from './Typography';
import { COLORS, SPACING } from '../utils/theme';

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
              podcast.subscription ? styles.subscribedTag : {}
            ]}
            onPress={() => onToggleSubscription(podcast.id)}
          >
            <Typography 
              variant="caption" 
              style={[
                styles.tagText, 
                podcast.subscription ? styles.subscribedTagText : {}
              ]}
            >
              {podcast.subscription ? 'Abonné' : 'S\'abonner'}
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
    overflow: 'hidden',
    padding: SPACING.md,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  podcastCover: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  podcastInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'space-between',
  },
  podcastName: {
    fontWeight: 'bold',
  },
  podcastAuthor: {
    color: COLORS.textSecondary,
  },
  episodeCount: {
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
  },
  subscriptionTag: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: SPACING.sm,
  },
  subscribedTag: {
    backgroundColor: COLORS.primary,
  },
  themeTag: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.text,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 12,
  },
  subscribedTagText: {
    color: COLORS.background,
  },
});
