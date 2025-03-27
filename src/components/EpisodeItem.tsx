import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Image,
  Modal,
  FlatList,
  TextInput,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from './Typography';
import { COLORS, SPACING } from '../utils/theme';
import { Episode, Podcast, EpisodeStatus } from '../types/podcast';
import { RootStackParamList } from '../types/navigation';
import { usePlayer } from '../contexts/PlayerContext';
import { useToast } from '../contexts/ToastContext';
import { PlaylistService } from '../services/PlaylistService';

type EpisodeItemProps = {
  episode: Episode;
  podcast: Podcast;
  inPlaylist?: boolean;
  playlistId?: string;
  onEpisodeRemoved?: () => void;
};

export const EpisodeItem: React.FC<EpisodeItemProps> = ({ 
  episode, 
  podcast,
  inPlaylist = false,
  playlistId,
  onEpisodeRemoved
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { 
    playEpisode, 
    togglePlayPause, 
    isPlaying, 
    currentEpisode 
  } = usePlayer();
  const { showToast } = useToast();

  const [menuVisible, setMenuVisible] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [createPlaylistMode, setCreatePlaylistMode] = useState(false);

  // Vérifier si cet épisode est celui qui est en cours de lecture
  const isCurrentEpisode = currentEpisode?.id === episode.id;

  useEffect(() => {
    if (menuVisible) {
      loadPlaylists();
    }
  }, [menuVisible]);

  const loadPlaylists = async () => {
    try {
      const playlistsData = await PlaylistService.getPlaylists();
      setPlaylists(playlistsData);
    } catch (error) {
      console.error('Erreur lors du chargement des playlists:', error);
      showToast('Erreur lors du chargement des playlists', 'error');
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    
    return `${minutes} min`;
  };

  const formatRemainingTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours} h ${minutes} min ${secs} sec restantes`;
    }
    
    return `${minutes} min ${secs} sec restantes`;
  };

  const getStatusLabel = (status: EpisodeStatus): string => {
    switch (status) {
      case EpisodeStatus.TO_LISTEN:
        return 'À écouter';
      case EpisodeStatus.LISTENING:
        return 'En cours';
      case EpisodeStatus.LISTENED:
        return 'Écouté';
      default:
        return '';
    }
  };

  const handlePress = () => {
    navigation.navigate('EpisodeDetails', {
      podcastId: podcast.id,
      episodeId: episode.id
    });
  };

  const handlePlayPress = () => {
    if (isCurrentEpisode) {
      // Si c'est l'épisode en cours, on bascule entre play et pause
      togglePlayPause();
    } else {
      // Sinon on lance la lecture de cet épisode
      playEpisode(episode, podcast);
    }
  };

  const handleAddToPlaylist = () => {
    setMenuVisible(true);
  };

  const handleRemoveFromPlaylist = async () => {
    if (!playlistId) return;
    
    try {
      Alert.alert(
        "Retirer l'épisode",
        "Es-tu sûr de vouloir retirer cet épisode de la playlist ?",
        [
          {
            text: "Annuler",
            style: "cancel"
          },
          {
            text: "Retirer",
            style: "destructive",
            onPress: async () => {
              await PlaylistService.removeEpisodeFromPlaylist(playlistId, episode.id);
              showToast("Épisode retiré de la playlist", "success");
              if (onEpisodeRemoved) {
                onEpisodeRemoved();
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erreur lors de la suppression de l'épisode:", error);
      showToast("Erreur lors de la suppression de l'épisode", "error");
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showToast('Veuillez entrer un nom pour la playlist', 'error');
      return;
    }

    try {
      const newPlaylist = await PlaylistService.createPlaylist(newPlaylistName.trim());
      await PlaylistService.addEpisodeToPlaylist(newPlaylist.id, episode);
      
      setNewPlaylistName('');
      setCreatePlaylistMode(false);
      setMenuVisible(false);
      
      showToast(`Épisode ajouté à la nouvelle playlist "${newPlaylist.name}"`, 'success');
    } catch (error) {
      console.error('Erreur lors de la création de la playlist:', error);
      showToast('Erreur lors de la création de la playlist', 'error');
    }
  };

  const handleSelectPlaylist = async (playlistId: string, playlistName: string) => {
    try {
      await PlaylistService.addEpisodeToPlaylist(playlistId, episode);
      setMenuVisible(false);
      showToast(`Épisode ajouté à la playlist "${playlistName}"`, 'success');
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la playlist:', error);
      showToast('Erreur lors de l\'ajout à la playlist', 'error');
    }
  };

  const renderPlaylistItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.playlistItem}
      onPress={() => handleSelectPlaylist(item.id, item.name)}
    >
      <Ionicons name="musical-notes" size={24} color={COLORS.primary} style={styles.playlistIcon} />
      <Typography variant="body" style={styles.playlistName} numberOfLines={1}>
        {item.name}
      </Typography>
      <Typography variant="caption" style={styles.episodeCount}>
        {item.episodes.length} épisode{item.episodes.length !== 1 ? 's' : ''}
      </Typography>
    </TouchableOpacity>
  );

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <Image 
        source={{ uri: episode.cover || podcast.cover || 'https://via.placeholder.com/60' }}
        style={styles.cover}
      />
      
      <View style={styles.content}>
        <Typography variant="body" style={styles.title} numberOfLines={1}>
          {episode.name}
        </Typography>
        
        <Typography variant="caption" style={styles.description} numberOfLines={2}>
          {episode.description}
        </Typography>
        
        <View style={styles.footer}>
          <View style={styles.tagsContainer}>
            <View style={[
              styles.tag, 
              episode.status === EpisodeStatus.LISTENING ? styles.listeningTag : 
              episode.status === EpisodeStatus.LISTENED ? styles.listenedTag : 
              styles.toListenTag
            ]}>
              <Typography variant="caption" style={styles.tagText}>
                {getStatusLabel(episode.status)}
              </Typography>
            </View>
            
            {episode.status !== EpisodeStatus.LISTENED && (
              <View style={styles.durationTag}>
                <Typography variant="caption" style={styles.tagText}>
                  {episode.status === EpisodeStatus.LISTENING && episode.timestamp !== undefined
                    ? formatRemainingTime(episode.duration - episode.timestamp)
                    : formatDuration(episode.duration)}
                </Typography>
              </View>
            )}
          </View>
        </View>
      </View>
      
      {inPlaylist ? (
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={handleRemoveFromPlaylist}
        >
          <Ionicons 
            name="remove-circle-outline" 
            size={28} 
            color={COLORS.error} 
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddToPlaylist}
        >
          <Ionicons 
            name="add-circle-outline" 
            size={28} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
      )}
      
      <TouchableOpacity 
        style={styles.playButton}
        onPress={handlePlayPress}
      >
        <Ionicons 
          name={(isCurrentEpisode && isPlaying) ? "pause-circle" : "play-circle"} 
          size={44} 
          color={COLORS.primary} 
        />
      </TouchableOpacity>

      {/* Menu contextuel pour ajouter à une playlist */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Typography variant="subtitle" style={styles.modalTitle}>
                Ajouter à une playlist
              </Typography>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => {
                  setMenuVisible(false);
                  setCreatePlaylistMode(false);
                  setNewPlaylistName('');
                }}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {createPlaylistMode ? (
              <View style={styles.createPlaylistContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Nom de la playlist"
                  placeholderTextColor={COLORS.textSecondary}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />
                
                <View style={styles.createPlaylistButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => {
                      setCreatePlaylistMode(false);
                      setNewPlaylistName('');
                    }}
                  >
                    <Typography variant="body">
                      Annuler
                    </Typography>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.createButton]}
                    onPress={handleCreatePlaylist}
                  >
                    <Typography variant="body" style={styles.createButtonText}>
                      Créer
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <TouchableOpacity 
                  style={styles.createPlaylistOption}
                  onPress={() => setCreatePlaylistMode(true)}
                >
                  <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                  <Typography variant="body" style={styles.createPlaylistText}>
                    Créer une nouvelle playlist
                  </Typography>
                </TouchableOpacity>

                {playlists.length > 0 ? (
                  <FlatList
                    data={playlists}
                    renderItem={renderPlaylistItem}
                    keyExtractor={item => item.id}
                    style={styles.playlistsList}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Typography variant="body" style={styles.emptyText}>
                      Aucune playlist existante
                    </Typography>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
  },
  toListenTag: {
    backgroundColor: COLORS.tertiary + '40',
  },
  listeningTag: {
    backgroundColor: COLORS.primary + '40',
  },
  listenedTag: {
    backgroundColor: COLORS.success + '40',
  },
  durationTag: {
    backgroundColor: COLORS.textTertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: COLORS.text,
  },
  addButton: {
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  removeButton: {
    marginLeft: SPACING.sm,
    marginRight: SPACING.xs,
  },
  playButton: {
    marginLeft: SPACING.xs,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.lg,
    width: '80%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: SPACING.sm,
  },
  createPlaylistOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  createPlaylistText: {
    marginLeft: SPACING.md,
    color: COLORS.primary,
  },
  playlistsList: {
    marginTop: SPACING.md,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  playlistIcon: {
    marginRight: SPACING.md,
  },
  playlistName: {
    flex: 1,
  },
  episodeCount: {
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  createPlaylistContainer: {
    padding: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    color: COLORS.text,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  createPlaylistButtons: {
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
  createButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  createButtonText: {
    color: COLORS.background,
  },
});
