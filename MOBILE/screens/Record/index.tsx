import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { styles } from "./styles";
import { Nav } from "../../components/Nav";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function RecordScreen() {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // Criar pasta de áudios
    const createAudioDirectory = async () => {
      try {
        const audioDir = `${FileSystem.documentDirectory}audios`;
        const dirInfo = await FileSystem.getInfoAsync(audioDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
        }
      } catch (error) {
        console.error('Erro ao criar pasta:', error);
      }
    };
    createAudioDirectory();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isRecording) {
        const newWaveform = Array.from(
          { length: 30 },
          () => Math.random() * 40 + 10
        );
        setWaveform(newWaveform);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [isRecording]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRecording) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1); // Incrementa o temporizador a cada segundo
      }, 1000);
    } else if (!isRecording && interval) {
      clearInterval(interval); // Limpa o intervalo quando a gravação para
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Precisamos de permissão para gravar áudio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
      setTimer(0); // Reseta o temporizador ao iniciar a gravação
    } catch (err) {
      console.error('Falha ao iniciar gravação', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);

      if (uri) {
        const fileName = `recording-${Date.now()}.m4a`;
        const audioDir = `${FileSystem.documentDirectory}audios`;
        const newUri = `${audioDir}/${fileName}`;
        
        // Garantir que o diretório existe
        const dirInfo = await FileSystem.getInfoAsync(audioDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
        }

        // Salvar o áudio
        await FileSystem.copyAsync({
          from: uri,
          to: newUri
        });
        
        Alert.alert(
          'Sucesso', 
          'Áudio salvo com sucesso! Deseja abrir a pasta?',
          [
            {
              text: 'Não',
              style: 'cancel'
            },
            {
              text: 'Sim',
              onPress: async () => {
                try {
                  await Sharing.shareAsync(newUri);
                } catch (error) {
                  console.error('Erro ao abrir pasta:', error);
                  Alert.alert('Erro', 'Não foi possível abrir a pasta');
                }
              }
            }
          ]
        );
      }
    } catch (err) {
      console.error('Falha ao parar gravação', err);
      Alert.alert('Erro', 'Não foi possível parar a gravação');
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topContainer}>
        <Text style={styles.title}>Calm Wave</Text>
        <Text style={styles.subtitle}>Bem vindo, Usuário!</Text>
      </View>
      <View style={styles.recordContainer}>
        <TouchableOpacity 
          style={styles.recordButton}
          onPress={startRecording}
        >
          <Text style={styles.recordButtonText}>Começar Gravação</Text>
          <Image
            source={require("../../assets/logos/mic.png")}
            style={styles.recordButtonIcon}
          />
        </TouchableOpacity>
        <View style={styles.waveformContainer}>
          {waveform.map((height, index) => (
            <View key={index} style={[styles.waveformBar, { height }]} />
          ))}
        </View>
        <TouchableOpacity 
          style={styles.stopButton}
          onPress={stopRecording}
        >
          <View style={styles.stopButtonOuter}>
            <View style={styles.stopButtonInner}>
              <View style={styles.stopButtonSquad}></View>
            </View>
          </View>
        </TouchableOpacity>
        {isRecording && (
          <Text style={styles.timerText}>{formatTime(timer)}</Text> // Temporizador exibido abaixo do botão de stop
        )}
      </View>
      <Nav/>
    </View>
  );
}
