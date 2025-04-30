import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import styles from './styles';

type AudioItemProps = {
  title: string;
  onPlay: () => void;
};

const AudioItem: React.FC<AudioItemProps> = ({ title, onPlay }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={onPlay} style={styles.button}>
        <Text style={styles.botaoTexto}>▶️ Play</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AudioItem;
