import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList,
  TextInput,
  Image,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '../components/Typography';
import { COLORS, SPACING } from '../utils/theme';
import { PodcastService } from '../services/PodcastService';
import { RootStackParamList } from '../types/navigation';
import { Podcast } from '../types/podcast';

type PodcastListScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PodcastList'
>;

export const PodcastListScreen: React.FC = () => {
  const navigation = useNavigation<PodcastListScreenNavigationProp>();
  
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [filteredPodcasts, setFilteredPodcasts] = useState<Podcast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPodcasts = async () => {
      try {
        setLoading(true);
        const podcastsData = await PodcastService.getPodcasts();
        setPodcasts(podcastsData);
        setFilteredPodcasts(podcastsData);
      } catch (error) {
        console.error('Erreur lors du chargement des podcasts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPodcasts();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredPodcasts(podcasts);
    } else {
      const filtered = podcasts.filter(podcast => 
        podcast.name.toLowerCase().includes(text.toLowerCase()) ||
        (podcast.author && podcast.author.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredPodcasts(filtered);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePodcastPress = (podcast: Podcast) => {
    navigation.navigate('EditPodcast', { podcastId: podcast.id });
  };

  const renderPodcastItem = ({ item }: { item: Podcast }) => (
    <TouchableOpacity 
      style={styles.podcastItem}
      onPress={() => handlePodcastPress(item)}
    >
      <Image 
        source={{ uri: item.cover || 'https://via.placeholder.com/60' }}
        style={styles.podcastCover}
      />
      <View style={styles.podcastInfo}>
        <Typography variant="subtitle" numberOfLines={1} style={styles.podcastName}>
          {item.name}
        </Typography>
        <Typography variant="caption" numberOfLines={1} style={styles.podcastAuthor}>
          {item.author || 'Auteur inconnu'}
        </Typography>
      </View>
      <Ionicons name="chevron-forward" size={24} color={COLORS.text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" center style={styles.headerTitle}>
          Modifier un podcast
        </Typography>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un podcast..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography variant="body" style={styles.loadingText}>
            Chargement des podcasts...
          </Typography>
        </View>
      ) : filteredPodcasts.length === 0 ? (
        <View style={styles.emptyContainer}>
          {searchQuery.length > 0 ? (
            <Typography variant="body" center>
              Aucun podcast ne correspond à votre recherche.
            </Typography>
          ) : (
            <Typography variant="body" center>
              Aucun podcast n'a été ajouté à votre bibliothèque.
            </Typography>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPodcasts}
          renderItem={renderPodcastItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xxxl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  backButton: {
    padding: SPACING.sm,
  },
  placeholder: {
    width: 24,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    color: COLORS.text,
    fontFamily: 'Rubik_400Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  listContent: {
    padding: SPACING.md,
  },
  podcastItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: SPACING.md,
    padding: SPACING.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  podcastCover: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  podcastInfo: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  podcastName: {
    fontWeight: 'bold',
  },
  podcastAuthor: {
    color: COLORS.textSecondary,
  },
});
