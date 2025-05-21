import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, SafeAreaView, Text, Alert, View, RefreshControl, TouchableOpacity } from 'react-native';
import AudioItem from '../../components/ListMusic'; // Assuming AudioItem component exists
import styles from './styles'; // Assuming styles are defined here
import { Nav } from '../../components/Nav'; // Assuming Nav component exists
import { useNavContext } from '@/context/navContext'; // Assuming NavContext exists
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { audioService, AudioListItem } from '../../src/services/audioService'; // Import AudioListItem and audioService

export default function AudioListScreen() {
  const { setSelecionado } = useNavContext();
  const [audioList, setAudioList] = useState<AudioListItem[]>([]); // Now uses AudioListItem type
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null); // Stores session_id of playing audio
  const [refreshing, setRefreshing] = useState(false); // For pull-to-refresh

  useEffect(() => {
    setSelecionado('audio');
    loadAudioFiles();
    return () => {
      setSelecionado('home');
      // Unload sound when component unmounts
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [setSelecionado]);

  /**
   * Loads audio files from the backend API.
   */
  const loadAudioFiles = useCallback(async () => {
    setRefreshing(true);
    try {
      const fetchedAudios = await audioService.listAudios();
      // Sort by creation date, newest first
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
  const handlePlay = async (path: string, id: string) => {
    try {
      // If already playing this audio, pause it
      if (currentlyPlaying === id && currentSound) {
        try {
          await currentSound.pauseAsync();
          setCurrentlyPlaying(null);
        } catch (error) {
          console.log('Erro ao pausar áudio:', error);
          // If error pausing, try to unload and reset
          await currentSound.unloadAsync();
          setCurrentSound(null);
          setCurrentlyPlaying(null);
        }
        return;
      }

      // If another audio is playing, stop it
      if (currentSound) {
        try {
          await currentSound.stopAsync();
          await currentSound.unloadAsync();
        } catch (error) {
          console.log('Erro ao parar áudio anterior:', error);
        }
        setCurrentSound(null);
      }

      // Load and play the new audio from the URL
      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true }
      );
      
      setCurrentSound(sound);
      setCurrentlyPlaying(id);

      // Set a callback for when the audio finishes playing
      sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
          try {
            await sound.unloadAsync();
          } catch (error) {
            console.log('Erro ao descarregar áudio após término:', error);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio. Verifique sua conexão.');
      // Clear state in case of error
      setCurrentSound(null);
      setCurrentlyPlaying(null);
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
              // If playing the audio that will be deleted, stop playback
              if (currentlyPlaying === id && currentSound) {
                await currentSound.stopAsync();
                await currentSound.unloadAsync();
                setCurrentSound(null);
                setCurrentlyPlaying(null);
              }

              // Call the backend API to delete the audio
              await audioService.deleteAudio(sessionId); // Backend uses session_id for deletion
              
              // Update the local list
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
            title={item.title}
            isPlaying={currentlyPlaying === item.id}
            onPlay={() => handlePlay(item.path, item.id)}
            onDelete={() => handleDelete(item.id, item.session_id)} // Pass session_id for deletion
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
      <Nav />
    </SafeAreaView>
  );
}
