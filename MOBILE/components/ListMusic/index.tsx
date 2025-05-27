import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
 
type AudioItemProps = {
  title: string;
  isPlaying: boolean;
  onPlay: () => void;
  onDelete: () => void;
  isLoading?: boolean;
};
 
const AudioItem: React.FC<AudioItemProps> = ({
  title,
  isPlaying,
  onPlay,
  onDelete,
  isLoading = false
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
 
  const handleDelete = () => {
    Alert.alert(
      'Excluir Áudio',
      'Tem certeza que deseja excluir este áudio? Esta ação não pode ser desfeita.',
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
              setIsDeleting(true);
              await onDelete();
            } catch (error) {
              console.error('Erro ao excluir áudio:', error);
              Alert.alert(
                'Erro',
                'Não foi possível excluir o áudio. Tente novamente mais tarde.'
              );
            } finally {
              setIsDeleting(false);
              setShowMenu(false);
            }
          },
        },
      ]
    );
  };
 
  const renderPlayButton = () => {
    if (isLoading) {
      return (
        <View style={styles.button}>
          <ActivityIndicator size="small" color="#391C73" />
        </View>
      );
    }
 
    return (
      <TouchableOpacity
        onPress={onPlay}
        style={[styles.button, isPlaying && styles.activeButton]}
        disabled={isLoading}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={42}
          color="#391C73"
        />
      </TouchableOpacity>
    );
  };
 
  return (
    <View style={[styles.container, isPlaying && styles.activeContainer]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
        {isPlaying && (
          <View style={styles.playingIndicator}>
            <Ionicons name="musical-notes" size={16} color="#391C73" />
          </View>
        )}
      </View>
     
      <View style={styles.buttonsContainer}>
        {renderPlayButton()}
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={styles.menuButton}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#391C73" />
          ) : (
            <Ionicons name="ellipsis-vertical" size={24} color="#391C73" />
          )}
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
              style={[styles.menuItem, isDeleting && styles.disabledMenuItem]}
              onPress={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF4444" />
              ) : (
                <>
                  <Ionicons name="trash" size={20} color="#FF4444" />
                  <Text style={[styles.menuText, { color: '#FF4444' }]}>Excluir</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};
 
export default AudioItem;