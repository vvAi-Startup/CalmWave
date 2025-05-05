import React, { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, Text, Alert, View } from 'react-native';
import AudioItem from '../../components/ListMusic'; 
import styles from './styles';
import { Nav } from '../../components/Nav';
import { useNavContext } from '@/context/navContext';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

type AudioFile = {
  id: string;
  title: string;
  path: string;
};

export default function AudioListScreen() {
  const { setSelecionado } = useNavContext();
  const [audioList, setAudioList] = useState<AudioFile[]>([]);
  const [currentSound, setCurrentSound] = useState<Audio.Sound | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);

  useEffect(() => {
    setSelecionado('audio');
    loadAudioFiles();
    return () => {
      setSelecionado('home');
      if (currentSound) {
        currentSound.unloadAsync();
      }
    };
  }, [setSelecionado]);

  const loadAudioFiles = async () => {
    try {
      const audioDir = `${FileSystem.documentDirectory}audios`;
      const dirInfo = await FileSystem.getInfoAsync(audioDir);
      
      if (dirInfo.exists) {
        const files = await FileSystem.readDirectoryAsync(audioDir);
        const audioFiles = files
          .filter(file => file.endsWith('.m4a'))
          .map((file, index) => ({
            id: String(index + 1),
            title: `Gravação ${index + 1}`,
            path: `${audioDir}/${file}`
          }));
        setAudioList(audioFiles);
      }
    } catch (error) {
      console.error('Erro ao carregar áudios:', error);
      Alert.alert('Erro', 'Não foi possível carregar os áudios');
    }
  };

  const handlePlay = async (path: string, id: string) => {
    try {
      // Se já estiver tocando este áudio, pausa
      if (currentlyPlaying === id && currentSound) {
        try {
          await currentSound.pauseAsync();
          setCurrentlyPlaying(null);
        } catch (error) {
          console.log('Erro ao pausar áudio:', error);
          // Se houver erro ao pausar, tenta recarregar o áudio
          await currentSound.unloadAsync();
          setCurrentSound(null);
          setCurrentlyPlaying(null);
        }
        return;
      }

      // Se estiver tocando outro áudio, para ele
      if (currentSound) {
        try {
          await currentSound.stopAsync();
          await currentSound.unloadAsync();
        } catch (error) {
          console.log('Erro ao parar áudio anterior:', error);
        }
        setCurrentSound(null);
      }

      // Verifica se o arquivo existe antes de tentar reproduzir
      const fileInfo = await FileSystem.getInfoAsync(path);
      if (!fileInfo.exists) {
        Alert.alert('Erro', 'Arquivo de áudio não encontrado');
        return;
      }

      // Carrega e toca o novo áudio
      const { sound } = await Audio.Sound.createAsync(
        { uri: path },
        { shouldPlay: true }
      );
      
      setCurrentSound(sound);
      setCurrentlyPlaying(id);

      // Quando o áudio terminar
      sound.setOnPlaybackStatusUpdate(async (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
          setCurrentlyPlaying(null);
          try {
            await sound.unloadAsync();
          } catch (error) {
            console.log('Erro ao descarregar áudio:', error);
          }
        }
      });
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error);
      Alert.alert('Erro', 'Não foi possível reproduzir o áudio');
      // Limpa o estado em caso de erro
      setCurrentSound(null);
      setCurrentlyPlaying(null);
    }
  };

  const handleDelete = async (id: string, path: string) => {
    try {
      // Se estiver tocando o áudio que será excluído, para a reprodução
      if (currentlyPlaying === id && currentSound) {
        await currentSound.stopAsync();
        await currentSound.unloadAsync();
        setCurrentSound(null);
        setCurrentlyPlaying(null);
      }

      // Exclui o arquivo
      await FileSystem.deleteAsync(path);
      
      // Atualiza a lista
      setAudioList(prevList => prevList.filter(audio => audio.id !== id));
      
      Alert.alert('Sucesso', 'Áudio excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir áudio:', error);
      Alert.alert('Erro', 'Não foi possível excluir o áudio');
    }
  };

  const EmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="mic-outline" size={64} color="#391C73" />
      <Text style={styles.emptyTitle}>Nenhum áudio encontrado</Text>
      <Text style={styles.emptyText}>
        Para começar a gravar, vá para a tela inicial e toque no botão de gravação
      </Text>
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
            onDelete={() => handleDelete(item.id, item.path)}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          audioList.length === 0 && styles.emptyListContainer
        ]}
        ListEmptyComponent={EmptyList}
      />
      <Nav />
    </SafeAreaView>
  );
}
