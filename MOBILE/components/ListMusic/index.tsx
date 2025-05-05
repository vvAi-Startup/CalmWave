import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; 
import styles from './styles';

type AudioItemProps = {
  title: string;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
};

const AudioItem: React.FC<AudioItemProps> = ({ 
  title, 
  isPlaying, 
  onPlay, 
  onDelete
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    Alert.alert(
      'Excluir Áudio',
      'Tem certeza que deseja excluir este áudio?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => {
            onDelete();
            setShowMenu(false);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity onPress={onPlay} style={styles.button}>
          <Ionicons 
            name={isPlaying ? "pause" : "play"} 
            size={42} 
            color="#391C73" 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#391C73" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#FF4444" />
              <Text style={[styles.menuText, { color: '#FF4444' }]}>Excluir</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default AudioItem;