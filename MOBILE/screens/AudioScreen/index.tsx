import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, SafeAreaView, Text, Alert, View, RefreshControl, TouchableOpacity } from 'react-native';
import AudioItem from '../../components/ListMusic'; // Assuming AudioItem component exists
import styles from './styles'; // Assuming styles are defined here
import { Nav } from '../../components/Nav'; // Assuming Nav component exists
import { useNavContext } from '@/context/navContext'; // Assuming NavContext exists
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { audioService, AudioListItem } from '../../src/services/audioService'; // Import AudioListItem and audioService
import AudioPlayer from '../../components/MusicPLayer/AudioPlayer';

export default function AudioListScreen() {
  const { setSelecionado } = useNavContext();
  const [audioList, setAudioList] = useState<AudioListItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);

  useEffect(() => {
    setSelecionado('audio');
    loadAudioFiles();
    return () => {
      setSelecionado('home');
    };
  }, [setSelecionado]);

  /**
   * Loads audio files from the backend API.
   */
  const loadAudioFiles = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedAudios = await audioService.listAudios();
      fetchedAudios.sort((a, b) => b.created_at - a.created_at);
      setAudioList(fetchedAudios);
      console.log('Audios loaded from backend:', fetchedAudios);
    } catch (error) {
      console.error('Erro ao carregar áudios do backend:', error);
      Alert.alert('Erro', 'Não foi possível carregar os áudios do servidor.');
    } finally {
      setRefreshing(false);
    }
  }, []);

  /**
   * Handles playing/pausing an audio file from its URL.
   * @param path The URL of the audio file (from backend).
   * @param id The MongoDB _id of the audio item.
   */
  const handlePlay = (path: string, id: string) => {
    if (selectedAudioId === id) {
      setSelectedAudioUrl(null);
      setSelectedAudioId(null);
    } else {
      setSelectedAudioUrl(path);
      setSelectedAudioId(id);
    }
  };

  /**
   * Handles deleting an audio file from the backend.
   * @param id The MongoDB _id of the audio item.
   * @param sessionId The session_id associated with the audio.
   */
  const handleDelete = async (id: string, sessionId: string) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta gravação?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          onPress: async () => {
            try {
              if (selectedAudioId === id) {
                setSelectedAudioUrl(null);
                setSelectedAudioId(null);
              }
              await audioService.deleteAudio(sessionId);
              setAudioList(prevList => prevList.filter(audio => audio.id !== id));
              Alert.alert('Sucesso', 'Áudio excluído com sucesso!');
            } catch (error) {
              console.error('Erro ao excluir áudio:', error);
              Alert.alert('Erro', 'Não foi possível excluir o áudio do servidor.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mic-outline" size={64} color="#391C73" />
      <Text style={styles.emptyTitle}>Nenhum áudio encontrado</Text>
      <Text style={styles.emptyText}>
        Para começar a gravar, vá para a tela inicial e toque no botão de gravação.
        Os áudios gravados aparecerão aqui após o processamento.
      </Text>
      <TouchableOpacity onPress={loadAudioFiles} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Recarregar</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Áudios Gravados</Text>
      <FlatList
        data={audioList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AudioItem
            title={item.title || 'Áudio sem título'}
            isPlaying={selectedAudioId === item.id}
            onPlay={() => handlePlay(item.path, item.id)}
            onDelete={() => handleDelete(item.id, item.session_id)}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          audioList.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={EmptyList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadAudioFiles} />
        }
      />
      <AudioPlayer
        uri={selectedAudioUrl || ''}
        visible={!!selectedAudioUrl}
        onClose={() => {
          setSelectedAudioUrl(null);
          setSelectedAudioId(null);
        }}
      />
      <Nav />
    </SafeAreaView>
  );
}
