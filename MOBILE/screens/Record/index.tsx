import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { styles } from "./styles"; // Assuming styles are defined here
import { Nav } from "../../components/Nav"; // Assuming Nav component exists
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { audioService } from '../../src/services/audioService'; // Updated audioService
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/src/config/api"; // Assuming API_BASE_URL is defined here

export default function RecordScreen() {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null); // Local URI of the recorded M4A
  const [timer, setTimer] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // For backend processing (conversion)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false); // For local file upload to backend
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Refs for managing intervals and directories
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionDirectory = useRef<string | null>(null); // Directory for the final M4A before upload
  const recordingRef = useRef<Audio.Recording | null>(null); // To hold the current recording object

  // Effect to create the main audio directory on component mount
  useEffect(() => {
    const createAudioDirectory = async () => {
      try {
        const audioDir = `${FileSystem.documentDirectory}audios`;
        const dirInfo = await FileSystem.getInfoAsync(audioDir);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(audioDir, { intermediates: true });
          console.log('Main audio directory created:', audioDir);
        }
      } catch (error) {
        console.error('Error creating main audio directory:', error);
      }
    };
    createAudioDirectory();
  }, []);

  // Effect for waveform animation
  useEffect(() => {
    const waveformUpdateInterval = setInterval(() => {
      if (isRecording) {
        // Generate random waveform heights for visual effect
        const newWaveform = Array.from({ length: 30 }, () => Math.random() * 40 + 10);
        setWaveform(newWaveform);
      } else {
        setWaveform([]); // Clear waveform when not recording
      }
    }, 200);
    return () => clearInterval(waveformUpdateInterval);
  }, [isRecording]);

  // Effect for recording timer
  useEffect(() => {
    if (isRecording) {
      timerIntervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording]);

  // Effect to check API connection on component mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  // Effect to keep recordingRef updated with the current recording state
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  /**
   * Checks the connection status with the backend API.
   */
  const checkApiConnection = async () => {
    try {
      setIsCheckingConnection(true);
      const token = await AsyncStorage.getItem('@CalmWave:token');
      // Using direct fetch for health check as audioService.testConnection also uses it
      const response = await fetch(`${API_BASE_URL}/health`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        await AsyncStorage.removeItem('@CalmWave:token');
        Alert.alert('Sessão expirada', 'Faça login novamente.');
        setIsConnected(false);
        return;
      }

      setIsConnected(response.ok);

      if (!response.ok) {
        Alert.alert("Erro de Conexão", 'Erro ao conectar com o servidor. Verifique sua conexão.');
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
      Alert.alert('Erro de Conexão', 'Verifique sua conexão e tente novamente.');
    } finally {
      setIsCheckingConnection(false);
    }
  };

  /**
   * Starts the audio recording.
   */
  async function startRecording() {
    if (!isConnected) {
      Alert.alert('Erro de Conexão', 'Não foi possível conectar com o servidor.', [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: checkApiConnection }
      ]);
      return;
    }

    const token = await AsyncStorage.getItem('@CalmWave:token');
    if (!token) {
      Alert.alert('Erro de Autenticação', 'Token não encontrado. Faça login novamente.');
      return;
    }

    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Erro', 'Permissão de microfone negada');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const newSessionId = `session_${Date.now()}`;
      // Create a new recording instance (records to M4A/AAC by default)
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      // Create a session-specific directory for the final audio file
      const sessionDir = `${FileSystem.documentDirectory}audios/${newSessionId}`;
      await FileSystem.makeDirectoryAsync(sessionDir, { intermediates: true });
      console.log('Session directory created:', sessionDir);

      setRecording(newRecording);
      recordingRef.current = newRecording;
      setSessionId(newSessionId);
      setIsRecording(true);
      setTimer(0);
      sessionDirectory.current = sessionDir;
      setUploadError(null);

    } catch (err) {
      console.error('Error starting recording:', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
    }
  }

  /**
   * Stops the audio recording, uploads the final audio, and triggers backend processing.
   */
  async function stopRecording() {
    if (!recording) return;

    try {
      // Clear the timer interval
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); // Get the local URI of the complete M4A file
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);

      if (uri && sessionId && sessionDirectory.current) {
        setIsProcessing(true); // Indicate that backend processing is starting
        try {
          // Define the filename for the complete audio file
          const finalAudioFileName = `final_audio.m4a`;
          const finalAudioPath = `${sessionDirectory.current}/${finalAudioFileName}`;

          // Copy the recorded audio to its final local path before uploading
          await FileSystem.copyAsync({ from: uri, to: finalAudioPath });
          console.log('Final audio saved locally:', finalAudioPath);

          setIsUploading(true);
          setUploadError(null);
          // Upload the complete audio file to the server
          await audioService.uploadAudio(finalAudioPath, sessionId); 
          setIsUploading(false);
          console.log('Final audio uploaded to server.');
          
          // Trigger backend processing (conversion to WAV)
          const processResult = await audioService.processAudio(sessionId);
          console.log('Backend processing result:', processResult);

          Alert.alert('Sucesso', 'Áudio processado com sucesso! Deseja abrir a pasta?', [
            { text: 'Não', style: 'cancel' },
            {
              text: 'Sim',
              onPress: async () => {
                try {
                  // Share the local M4A file (before it's deleted)
                  await Sharing.shareAsync(finalAudioPath);
                } catch (error) {
                  console.error('Erro ao abrir pasta para compartilhamento:', error);
                  Alert.alert('Erro', 'Não foi possível abrir a pasta para compartilhamento');
                }
              }
            }
          ]);
        } catch (error) {
          console.error('Erro no processamento ou upload:', error);
          setUploadError(error instanceof Error ? error.message : 'Erro desconhecido');
          Alert.alert('Erro', 'Não foi possível processar o áudio');
        } finally {
          setIsProcessing(false);
          setSessionId(null);
          sessionDirectory.current = null;
          // Clean up the local audio file after upload and processing
          if (finalAudioPath) {
            try {
              await FileSystem.deleteAsync(finalAudioPath);
              console.log('Arquivo de áudio local final deletado:', finalAudioPath);
            } catch (error) {
              console.warn('Erro ao deletar arquivo de áudio local final:', error);
            }
          }
        }
      }
    } catch (err) {
      console.error('Erro ao parar gravação:', err);
      Alert.alert('Erro', 'Falha ao parar a gravação');
    }
  }

  /**
   * Formats time in seconds to MM:SS format.
   * @param seconds Total seconds.
   * @returns Formatted time string.
   */
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
        {isCheckingConnection ? (
          <Text style={styles.connectionText}>Verificando conexão...</Text>
        ) : isConnected === false ? (
          <TouchableOpacity onPress={checkApiConnection}>
            <Text style={styles.errorText}>Erro de conexão. Toque para tentar novamente.</Text>
          </TouchableOpacity>
        ) : isConnected ? (
          <Text style={styles.successText}>Conectado ao servidor</Text>
        ) : null}
      </View>
      <View style={styles.recordContainer}>
        <TouchableOpacity style={styles.recordButton} onPress={startRecording} disabled={isProcessing || isRecording}>
          <Text style={styles.recordButtonText}>Começar Gravação</Text>
          <Image source={require("../../assets/logos/mic.png")} style={styles.recordButtonIcon} />
        </TouchableOpacity>
        <View style={styles.waveformContainer}>
          {waveform.map((height, index) => (
            <View key={index} style={[styles.waveformBar, { height }]} />
          ))}
        </View>
        <TouchableOpacity style={styles.stopButton} onPress={stopRecording} disabled={isProcessing || !isRecording}>
          <View style={styles.stopButtonOuter}>
            <View style={styles.stopButtonInner}>
              <View style={styles.stopButtonSquad}></View>
            </View>
          </View>
        </TouchableOpacity>
        {isRecording && <Text style={styles.timerText}>{formatTime(timer)}</Text>}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.processingText}>Processando áudio...</Text>
          </View>
        )}
        {uploadError && <Text style={styles.errorText}>{uploadError}</Text>}
        {isUploading && <Text style={styles.uploadingText}>Enviando áudio...</Text>}
      </View>
      <Nav />
    </View>
  );
}
