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
import { Episode, Podcast, EpisodeStatus, EpisodeState } from '../types/podcast';
import { RootStackParamList } from '../types/navigation';
import { usePlayer } from '../contexts/PlayerContext';
import { useToast } from '../contexts/ToastContext';
import { PlaylistService } from '../services/PlaylistService';
import { useActiveProfile } from '../contexts/ActiveProfileContext';

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
  const { activeProfile } = useActiveProfile();

  const [menuVisible, setMenuVisible] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [createPlaylistMode, setCreatePlaylistMode] = useState(false);

  // Vérifier si cet épisode est celui qui est en cours de lecture
  const isCurrentEpisode = currentEpisode?.id === episode.id;

  // Récupérer le statut de l'épisode pour le profil actif
  const episodeState = episode.status?.find(
    (state: EpisodeState) => activeProfile && state.profileId === activeProfile.id
  );

  const episodeStatus = episodeState?.status || EpisodeStatus.TO_LISTEN;
  const timestamp = episodeState?.timestamp || 0;

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

  const addEpisodeToPlaylist = async (playlistId: string) => {
    try {
      await PlaylistService.addEpisodeToPlaylist(playlistId, episode);
      showToast("Épisode ajouté à la playlist", "success");
      setMenuVisible(false);
    } catch (error) {
      console.error("Erreur lors de l'ajout à la playlist:", error);
      showToast("Erreur lors de l'ajout à la playlist", "error");
    }
  };

  const createNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showToast("Veuillez entrer un nom de playlist", "error");
      return;
    }

    try {
      const newPlaylist = await PlaylistService.createPlaylist(newPlaylistName);
      await PlaylistService.addEpisodeToPlaylist(newPlaylist.id, episode);
      showToast("Playlist créée et épisode ajouté", "success");
      setMenuVisible(false);
      setCreatePlaylistMode(false);
      setNewPlaylistName('');
    } catch (error) {
      console.error("Erreur lors de la création de la playlist:", error);
      showToast("Erreur lors de la création de la playlist", "error");
    }
  };

  // Adaptez la durée affichée en fonction du statut d'écoute
  const renderDurationTag = () => {
    // Si l'épisode est en cours d'écoute et a un timestamp > 0
    if (episodeStatus === EpisodeStatus.LISTENING && timestamp > 0) {
      const remainingTime = episode.duration - timestamp;
      return (
        <View style={styles.durationTag}>
          <Typography variant="caption" style={styles.tagText}>
            {formatRemainingTime(remainingTime)}
          </Typography>
        </View>
      );
    }
    
    // Sinon, afficher la durée totale
    return (
      <View style={styles.durationTag}>
        <Typography variant="caption" style={styles.tagText}>
          {formatDuration(episode.duration)}
        </Typography>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.episodeContainer} 
        onPress={handlePress}
      >
        <Image 
          source={{ uri: episode.cover || podcast.cover || 'https://via.placeholder.com/150' }} 
          style={styles.cover}
        />
        <View style={styles.infoContainer}>
          <Typography variant="body" numberOfLines={2} style={styles.title}>
            {episode.name}
          </Typography>
          <Typography variant="caption" numberOfLines={2} style={styles.description}>
            {episode.description}
          </Typography>
          
          <View style={styles.tagsContainer}>
            <View style={[styles.statusTag, getStatusTagStyle(episodeStatus)]}>
              <Typography variant="caption" style={styles.tagText}>
                {getStatusLabel(episodeStatus)}
              </Typography>
            </View>
            
            {renderDurationTag()}
          </View>
        </View>
      </TouchableOpacity>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={handlePlayPress} style={styles.playButton}>
          <Ionicons 
            name={isCurrentEpisode && isPlaying ? "pause-circle" : "play-circle"} 
            size={36} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
        
        {!inPlaylist ? (
          <TouchableOpacity onPress={handleAddToPlaylist} style={styles.addToPlaylistButton}>
            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleRemoveFromPlaylist} style={styles.addToPlaylistButton}>
            <Ionicons name="trash-outline" size={24} color={COLORS.error} />
          </TouchableOpacity>
        )}
      </View>
      
      {/* Modal pour ajouter à une playlist */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Typography variant="subtitle" style={styles.modalTitle}>
              Ajouter à une playlist
            </Typography>
            
            {createPlaylistMode ? (
              <View style={styles.createPlaylistContainer}>
                <TextInput
                  style={styles.playlistNameInput}
                  placeholder="Nom de la playlist"
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  placeholderTextColor={COLORS.textSecondary}
                />
                <View style={styles.createPlaylistButtonsContainer}>
                  <TouchableOpacity 
                    style={[styles.createPlaylistButton, styles.cancelButton]} 
                    onPress={() => setCreatePlaylistMode(false)}
                  >
                    <Typography variant="body" style={styles.buttonText}>
                      Annuler
                    </Typography>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.createPlaylistButton, styles.confirmButton]} 
                    onPress={createNewPlaylist}
                  >
                    <Typography variant="body" style={styles.buttonText}>
                      Créer
                    </Typography>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <>
                <FlatList
                  data={playlists}
                  keyExtractor={(item) => item.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.playlistItem}
                      onPress={() => addEpisodeToPlaylist(item.id)}
                    >
                      <Typography variant="body" style={styles.playlistName}>
                        {item.name}
                      </Typography>
                      <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <Typography variant="body" style={styles.emptyListText}>
                      Aucune playlist disponible
                    </Typography>
                  }
                  style={styles.playlistList}
                />
                
                <TouchableOpacity 
                  style={styles.createNewPlaylistButton}
                  onPress={() => setCreatePlaylistMode(true)}
                >
                  <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                  <Typography variant="body" style={styles.createNewPlaylistText}>
                    Créer une nouvelle playlist
                  </Typography>
                </TouchableOpacity>
              </>
            )}
            
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setMenuVisible(false)}
            >
              <Typography variant="body" style={styles.closeModalText}>
                Fermer
              </Typography>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
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
  episodeContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  cover: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  description: {
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.xs,
  },
  statusTag: {
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    marginRight: SPACING.sm,
  },
  durationTag: {
    borderWidth: 1,
    borderColor: COLORS.tertiary,
    borderRadius: 12,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  tagText: {
    color: COLORS.text,
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  playButton: {
    marginBottom: SPACING.xs,
  },
  addToPlaylistButton: {
    padding: SPACING.xs,
  },
  
  // Styles pour le modal
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: SPACING.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  playlistList: {
    marginBottom: SPACING.md,
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  playlistName: {
    flex: 1,
  },
  emptyListText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
    marginVertical: SPACING.lg,
  },
  createNewPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  createNewPlaylistText: {
    marginLeft: SPACING.sm,
    color: COLORS.primary,
  },
  createPlaylistContainer: {
    marginBottom: SPACING.lg,
  },
  playlistNameInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  createPlaylistButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createPlaylistButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: SPACING.sm,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  buttonText: {
    color: COLORS.text,
  },
  closeModalButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeModalText: {
    color: COLORS.text,
  },
});

// Fonction utilitaire pour obtenir le style selon le statut
const getStatusTagStyle = (status: EpisodeStatus): any => {
  switch (status) {
    case EpisodeStatus.LISTENED:
      return { borderColor: COLORS.success };
    case EpisodeStatus.LISTENING:
      return { borderColor: COLORS.primary };
    default:
      return { borderColor: COLORS.tertiary };
  }
};
