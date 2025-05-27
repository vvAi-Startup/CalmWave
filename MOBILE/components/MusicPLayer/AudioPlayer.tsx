import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface AudioPlayerProps {
  uri: string;
  visible: boolean;
  onClose?: () => void;
}

const speeds = [0.5, 1.0];

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ uri, visible, onClose }) => {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [speedIndex, setSpeedIndex] = useState(1);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (uri && visible) {
      loadSound();
    }
    return () => {
      isMounted.current = false;
      unloadSound();
    };
  }, [uri, visible]);

  const loadSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      if (!uri) {
        console.error('URI do áudio não fornecida');
        return;
      }

      console.log('Carregando áudio:', uri);
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: true,
          rate: speeds[speedIndex],
          shouldCorrectPitch: true,
          pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
        },
        onPlaybackStatusUpdate
      );

      setSound(newSound);
      setIsPlaying('isLoaded' in status && status.isLoaded ? status.isPlaying : false);
      setDuration('isLoaded' in status && status.isLoaded && status.durationMillis ? status.durationMillis : 1);
    } catch (error) {
      console.error('Erro ao carregar áudio:', error);
      Alert.alert('Erro', 'Não foi possível carregar o áudio. Por favor, tente novamente.');
    }
  };

  const unloadSound = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (!isMounted.current) return;

    if ('isLoaded' in status && status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis || 1);
      setIsPlaying(status.isPlaying);

      // Se o áudio terminar de tocar, resetar o player
      if (status.didJustFinish) {
        setPosition(0);
        setIsPlaying(false);
      }
    }
  };

  const handlePlayPause = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
    } else {
      await sound.playAsync();
    }
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
    }
  };

  const handleSkip = async (ms: number) => {
    if (sound) {
      let newPosition = position + ms;
      if (newPosition < 0) newPosition = 0;
      if (newPosition > duration) newPosition = duration;
      await sound.setPositionAsync(newPosition);
    }
  };

  const handleSpeed = async () => {
    const nextIndex = (speedIndex + 1) % speeds.length;
    setSpeedIndex(nextIndex);
    if (sound) {
      await sound.setRateAsync(
        speeds[nextIndex],
        true,
        Audio.PitchCorrectionQuality.High
      );
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => handleSkip(-5000)}>
          <Ionicons name="play-back" size={32} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handlePlayPause}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={40} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleSkip(5000)}>
          <Ionicons name="play-forward" size={32} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSpeed}>
          <Text style={styles.speedBtn}>{speeds[speedIndex]}x</Text>
        </TouchableOpacity>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </TouchableOpacity>
        )}
      </View>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration}
        value={position}
        onSlidingComplete={handleSeek}
        minimumTrackTintColor="#1EB1FC"
        maximumTrackTintColor="#d3d3d3"
        thumbTintColor="#1EB1FC"
      />
      <View style={styles.timeRow}>
        <Text style={styles.time}>{formatMillis(position)}</Text>
        <Text style={styles.time}>{formatMillis(duration)}</Text>
      </View>
    </View>
  );
};

function formatMillis(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 60, 
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: '#000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    justifyContent: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  time: {
    color: '#333',
    fontSize: 14,
  },
  speedBtn: {
    fontSize: 16,
    color: '#1EB1FC',
    fontWeight: 'bold',
  },
});

export default AudioPlayer; 