import React, { useEffect, useState } from 'react';
import { 
  View, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Modal
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Typography } from '../components/Typography';
import { COLORS, SPACING } from '../utils/theme';
import { RootStackParamList } from '../types/navigation';
import { Playlist } from '../types/podcast';
import { useToast } from '../contexts/ToastContext';

type PlaylistScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Playlists'
>;

type PlaylistScreenRouteProp = RouteProp<
  RootStackParamList,
  'Playlists'
>;

export const PlaylistScreen: React.FC = () => {
  const navigation = useNavigation<PlaylistScreenNavigationProp>();
  const route = useRoute<PlaylistScreenRouteProp>();
  const { profileId } = route.params || {};
  const { showToast } = useToast();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    loadPlaylists();
  }, []);

  const loadPlaylists = async () => {
    try {
      setLoading(true);
      const playlistsData = await AsyncStorage.getItem('PLAYLISTS');
      
      if (playlistsData) {
        setPlaylists(JSON.parse(playlistsData));
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des playlists:', error);
      showToast('Erreur lors du chargement des playlists', 'error');
    } finally {
      setLoading(false);
    }
  };

  const savePlaylists = async (updatedPlaylists: Playlist[]) => {
    try {
      await AsyncStorage.setItem('PLAYLISTS', JSON.stringify(updatedPlaylists));
      setPlaylists(updatedPlaylists);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des playlists:', error);
      showToast('Erreur lors de la sauvegarde des playlists', 'error');
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      showToast('Veuillez entrer un nom pour la playlist', 'error');
      return;
    }

    const newPlaylist: Playlist = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      name: newPlaylistName.trim(),
      episodes: [],
      deleteable: true
    };

    const updatedPlaylists = [...playlists, newPlaylist];
    await savePlaylists(updatedPlaylists);
    
    setNewPlaylistName('');
    setModalVisible(false);
    showToast('Playlist créée avec succès', 'success');
  };

  const handlePlaylistPress = (playlist: Playlist) => {
    // Navigation vers l'écran de détails de la playlist
    navigation.navigate('PlaylistDetails', { 
      playlistId: playlist.id 
    });
  };

  const renderPlaylistItem = ({ item }: { item: Playlist }) => (
    <TouchableOpacity 
      style={styles.playlistItem}
      onPress={() => handlePlaylistPress(item)}
    >
      <View style={styles.playlistInfo}>
        <Typography variant="subtitle" numberOfLines={1} style={styles.playlistName}>
          {item.name}
        </Typography>
        <Typography variant="caption" style={styles.episodeCount}>
          {item.episodes.length} épisode{item.episodes.length !== 1 ? 's' : ''}
        </Typography>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Typography variant="title" style={styles.headerTitle}>
          Mes playlists
        </Typography>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {playlists.length > 0 ? (
        <FlatList
          data={playlists}
          renderItem={renderPlaylistItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.playlistsList}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Ionicons name="musical-notes" size={64} color={COLORS.textSecondary} />
          <Typography variant="body" style={styles.emptyStateText}>
            Tu n'as pas encore créé de playlist.
          </Typography>
          <Typography variant="body" style={styles.emptyStateSubtext}>
            Crée ta première playlist en appuyant sur le bouton +
          </Typography>
        </View>
      )}

      {/* Modal pour créer une nouvelle playlist */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Typography variant="subtitle" style={styles.modalTitle}>
              Nouvelle playlist
            </Typography>
            
            <TextInput
              style={styles.input}
              placeholder="Nom de la playlist"
              placeholderTextColor={COLORS.textSecondary}
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setNewPlaylistName('');
                  setModalVisible(false);
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: SPACING.sm,
  },
  playlistsList: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 8,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  episodeCount: {
    color: COLORS.textSecondary,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  emptyStateText: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  emptyStateSubtext: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
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
  input: {
    backgroundColor: COLORS.background,
    color: COLORS.text,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
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
  createButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  createButtonText: {
    color: COLORS.background,
  },
});
