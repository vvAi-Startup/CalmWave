import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, SafeAreaView, Text, Alert, View, RefreshControl, TouchableOpacity, ActivityIndicator } from 'react-native';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAudioUrl, setSelectedAudioUrl] = useState<string | null>(null);
  const [selectedAudioId, setSelectedAudioId] = useState<string | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
 
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
    setError(null);
    try {
      console.log('Iniciando carregamento de áudios...');
      const fetchedAudios = await audioService.listAudios();
      console.log('Áudios recebidos:', fetchedAudios);
     
      if (!Array.isArray(fetchedAudios)) {
        throw new Error('Formato de resposta inválido do servidor');
      }
 
      const sortedAudios = fetchedAudios.sort((a, b) => b.created_at - a.created_at);
      setAudioList(sortedAudios);
      console.log('Lista de áudios atualizada:', sortedAudios);
    } catch (error) {
      console.error('Erro ao carregar áudios:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Não foi possível carregar os áudios: ${errorMessage}`);
      Alert.alert(
        'Erro ao Carregar Áudios',
        'Não foi possível carregar os áudios do servidor. Verifique sua conexão e tente novamente.',
        [
          {
            text: 'Tentar Novamente',
            onPress: loadAudioFiles
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, []);
 
  /**
   * Handles playing/pausing an audio file from its URL.
   * @param path The URL of the audio file (from backend).
   * @param id The MongoDB _id of the audio item.
   */
  const handlePlay = async (path: string, id: string) => {
    if (!path) {
      Alert.alert('Erro', 'URL do áudio inválida');
      return;
    }
 
    try {
      setLoadingAudioId(id);
     
      if (selectedAudioId === id) {
        setSelectedAudioUrl(null);
        setSelectedAudioId(null);
      } else {
        setSelectedAudioUrl(path);
        setSelectedAudioId(id);
      }
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio. Tente novamente mais tarde.');
    } finally {
      setLoadingAudioId(null);
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
      'Tem certeza que deseja excluir esta gravação? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
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
              Alert.alert(
                'Erro ao Excluir',
                'Não foi possível excluir o áudio. Tente novamente mais tarde.',
                [
                  {
                    text: 'Tentar Novamente',
                    onPress: () => handleDelete(id, sessionId)
                  },
                  {
                    text: 'OK',
                    style: 'cancel'
                  }
                ]
              );
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
      <Text style={styles.emptyTitle}>
        {error ? 'Erro ao Carregar Áudios' : 'Nenhum áudio encontrado'}
      </Text>
      <Text style={styles.emptyText}>
        {error
          ? 'Ocorreu um erro ao carregar os áudios. Tente novamente mais tarde.'
          : 'Para começar a gravar, vá para a tela inicial e toque no botão de gravação. Os áudios gravados aparecerão aqui após o processamento.'}
      </Text>
      <TouchableOpacity onPress={loadAudioFiles} style={styles.refreshButton}>
        <Text style={styles.refreshButtonText}>Recarregar</Text>
      </TouchableOpacity>
    </View>
  );
 
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#391C73" />
          <Text style={styles.loadingText}>Carregando áudios...</Text>
        </View>
      </SafeAreaView>
    );
  }
 
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
            isLoading={loadingAudioId === item.id}
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
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadAudioFiles}
            colors={['#391C73']}
            tintColor="#391C73"
          />
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
 