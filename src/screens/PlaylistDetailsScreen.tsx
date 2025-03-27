import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from '../components/Typography';
import { EpisodeItem } from '../components/EpisodeItem';
import { COLORS, SPACING, SIZES } from '../utils/theme';
import { usePlayer } from '../contexts/PlayerContext';
import { useToast } from '../contexts/ToastContext';
import { RootStackParamList } from '../types/navigation';
import { Playlist, Episode } from '../types/podcast';

type PlaylistDetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PlaylistDetails'
>;

type PlaylistDetailsScreenRouteProp = RouteProp<
  RootStackParamList,
  'PlaylistDetails'
>;

export const PlaylistDetailsScreen: React.FC = () => {
  const navigation = useNavigation<PlaylistDetailsScreenNavigationProp>();
  const route = useRoute<PlaylistDetailsScreenRouteProp>();
  const { playlistId } = route.params;
  const { playEpisode } = usePlayer();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

  useEffect(() => {
    loadPlaylist();
  }, [playlistId]);

  const loadPlaylist = async () => {
    try {
      setLoading(true);
      const playlistsData = await AsyncStorage.getItem('PLAYLISTS');
      
      if (playlistsData) {
        const playlists: Playlist[] = JSON.parse(playlistsData);
        const currentPlaylist = playlists.find(p => p.id === playlistId);
        
        if (currentPlaylist) {
          setPlaylist(currentPlaylist);
          setEpisodes(currentPlaylist.episodes);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la playlist:', error);
      showToast('Erreur lors du chargement de la playlist', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleDeletePlaylist = async () => {
    try {
      const playlistsData = await AsyncStorage.getItem('PLAYLISTS');
      
      if (playlistsData && playlist) {
        const playlists: Playlist[] = JSON.parse(playlistsData);
        const updatedPlaylists = playlists.filter(p => 
          p.id !== playlist.id || !p.deleteable
        );
        
        await AsyncStorage.setItem('PLAYLISTS', JSON.stringify(updatedPlaylists));
        showToast('Playlist supprimée avec succès', 'success');
        
        // Retourner à l'écran précédent après une courte pause
        setTimeout(() => {
          navigation.goBack();
        }, 1000);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la playlist:', error);
      showToast('Erreur lors de la suppression de la playlist', 'error');
    }
  };

  const confirmDelete = () => {
    setConfirmDeleteVisible(true);
  };

  const cancelDelete = () => {
    setConfirmDeleteVisible(false);
  };

  const handleEpisodePress = (episode: Episode) => {
    // Pour l'instant, on ne fait rien quand on clique sur un épisode
    // Cette fonctionnalité pourra être implémentée plus tard
  };

  const renderEpisodeItem = ({ item }: { item: Episode }) => {
    return (
      <EpisodeItem
        episode={item}
        podcast={{
          id: 'playlist',
          name: playlist?.name || 'Playlist',
          description: '',
          cover: item.cover,
          url: '',
          author: '',
          types: [],
          ageRanges: [],
          subscription: false,
          episodes: [],
          deleteable: true
        }}
        inPlaylist={true}
        playlistId={playlistId}
        onEpisodeRemoved={loadPlaylist}
      />
    );
  };

  if (loading || !playlist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Typography variant="body" style={styles.loadingText}>
            Chargement de la playlist...
          </Typography>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
        {playlist.deleteable && (
          <TouchableOpacity onPress={confirmDelete} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.playlistHeader}>
        <View style={styles.playlistCoverContainer}>
          <Ionicons name="musical-notes" size={60} color={COLORS.primary} style={styles.playlistIcon} />
        </View>
        <View style={styles.playlistInfo}>
          <Typography variant="subtitle" style={styles.playlistName} numberOfLines={2}>
            {playlist.name}
          </Typography>
          <Typography variant="caption" style={styles.episodeCount}>
            {playlist.episodes.length} épisode{playlist.episodes.length !== 1 ? 's' : ''}
          </Typography>
        </View>
      </View>

      {episodes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Typography variant="body" center>
            Cette playlist ne contient aucun épisode.
          </Typography>
        </View>
      ) : (
        <FlatList
          data={episodes}
          renderItem={renderEpisodeItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Modal de confirmation de suppression */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={confirmDeleteVisible}
        onRequestClose={cancelDelete}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Typography variant="subtitle" style={styles.modalTitle}>
              Supprimer la playlist
            </Typography>
            <Typography variant="body" style={styles.modalText}>
              Es-tu sûr de vouloir supprimer cette playlist ?
            </Typography>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelDelete}
              >
                <Typography variant="body">
                  Annuler
                </Typography>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteModalButton]}
                onPress={handleDeletePlaylist}
              >
                <Typography variant="body" style={styles.deleteButtonText}>
                  Supprimer
                </Typography>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerSpacer: {
    flex: 1,
  },
  backButton: {
    padding: SPACING.sm,
  },
  deleteButton: {
    padding: SPACING.sm,
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
  playlistHeader: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  playlistCoverContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playlistIcon: {
    opacity: 0.8,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: SPACING.md,
    justifyContent: 'center',
  },
  playlistName: {
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  episodeCount: {
    color: COLORS.textSecondary,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
    padding: SPACING.lg,
  },
  modalTitle: {
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.cardBackground,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deleteModalButton: {
    backgroundColor: COLORS.error,
    marginLeft: SPACING.sm,
  },
  deleteButtonText: {
    color: COLORS.background,
  },
});
