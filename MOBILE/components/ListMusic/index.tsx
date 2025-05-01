import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import styles from './styles';

type AudioItemProps = {
  title: string;
  onPlay: () => void;
};

const AudioItem: React.FC<AudioItemProps> = ({ title, onPlay }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePress = () => {
    setIsPlaying(!isPlaying);
    onPlay(); 
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={handlePress} style={styles.button}>
        <Ionicons 
          name={isPlaying ? "pause" : "play"} 
          size={42} 
          color="#391C73" 
        />
      </TouchableOpacity>
    </View>
  );
};

export default AudioItem;