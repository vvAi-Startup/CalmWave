import React from 'react';
import { FlatList, SafeAreaView, Text } from 'react-native';
import AudioItem from '../../components/ListMusic'; 
import styles from './styles';

const audioList = [
  { id: '1', title: 'Gravação 1', path: 'audio1.mp3' },
  { id: '2', title: 'Gravação 2', path: 'audio2.mp3' },
  { id: '3', title: 'Gravação 3', path: 'audio3.mp3' },
];

export default function AudioListScreen() {
  const handlePlay = (path: string) => {
    console.log('Tocar:', path);
    //logica para tocar audio - implementar depois
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>Áudios Gravados</Text>
      <FlatList
        data={audioList}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AudioItem
            title={item.title}
            onPlay={() => handlePlay(item.path)}
          />
        )}
        contentContainerStyle={styles.listContainer}
      />
    </SafeAreaView>
  );
}
