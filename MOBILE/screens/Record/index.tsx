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
  const [audioUri, setAudioUri] = useState<string | null>(null); // URI local do M4A gravado
  const [timer, setTimer] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false); // Para processamento no backend (conversão e denoising)
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false); // Para upload do arquivo local para o backend
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Refs para gerenciar intervalos e diretórios
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionDirectory = useRef<string | null>(null); // Diretório para o M4A final antes do upload
  const recordingRef = useRef<Audio.Recording | null>(null); // Para manter o objeto de gravação atual

  // Efeito para criar o diretório principal de áudio ao montar o componente
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

  // Efeito para animação da forma de onda
  useEffect(() => {
    const waveformUpdateInterval = setInterval(() => {
      if (isRecording) {
        // Gera alturas aleatórias para as barras da forma de onda para efeito visual
        const newWaveform = Array.from({ length: 30 }, () => Math.random() * 40 + 10);
        setWaveform(newWaveform);
      } else {
        setWaveform([]); // Limpa a forma de onda quando não está gravando
      }
    }, 200);
    return () => clearInterval(waveformUpdateInterval);
  }, [isRecording]);

  // Efeito para o temporizador de gravação
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

  // Efeito para verificar a conexão da API ao montar o componente
  useEffect(() => {
    checkApiConnection();
  }, []);

  // Efeito para manter recordingRef atualizado com o estado de gravação atual
  useEffect(() => {
    recordingRef.current = recording;
  }, [recording]);

  /**
   * Verifica o status da conexão com a API do backend.
   */
  const checkApiConnection = async () => {
    try {
      setIsCheckingConnection(true);
      const token = await AsyncStorage.getItem('@CalmWave:token');
      // Usando fetch direto para verificação de saúde, pois audioService.testConnection também o utiliza
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
   * Inicia a gravação de áudio.
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
      // Cria uma nova instância de gravação (grava em M4A/AAC por padrão)
      const { recording: newRecording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      // Cria um diretório específico da sessão para o arquivo de áudio final
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
   * Baixa o áudio WAV processado do backend.
   * @param id O ID da sessão para o áudio a ser baixado.
   * @returns O URI local do arquivo WAV baixado.
   */
  async function downloadProcessedAudio(id: string): Promise<string> {
    try {
      console.log(`Tentando baixar áudio processado para a sessão: ${id}`);
      const localWavUri = await audioService.downloadAudio(id);
      console.log('Áudio processado baixado localmente para:', localWavUri);
      return localWavUri;
    } catch (error) {
      console.error('Erro ao baixar áudio processado:', error);
      Alert.alert('Erro de Download', 'Não foi possível baixar o áudio processado.');
      throw error;
    }
  }

  /**
   * Para a gravação de áudio, faz o upload do áudio final e aciona o processamento no backend.
   */
  async function stopRecording() {
    if (!recording) return;

    let finalAudioPathLocalM4A: string | null = null; // Caminho para o M4A original local
    let downloadedWavUri: string | null = null; // Caminho para o WAV baixado

    try {
      // Limpa o intervalo do temporizador
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI(); // Obtém o URI local do arquivo M4A completo
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);

      if (uri && sessionId && sessionDirectory.current) {
        setIsProcessing(true); // Indica que o processamento no backend está começando
        try {
          // Define o nome do arquivo para o arquivo de áudio completo (M4A)
          const finalAudioFileName = `final_audio.m4a`;
          finalAudioPathLocalM4A = `${sessionDirectory.current}/${finalAudioFileName}`;

          // Copia o áudio gravado para seu caminho local final antes do upload
          await FileSystem.copyAsync({ from: uri, to: finalAudioPathLocalM4A });
          console.log('Áudio M4A original salvo localmente:', finalAudioPathLocalM4A);

          setIsUploading(true);
          setUploadError(null);
          // Faz o upload do arquivo de áudio M4A completo para o servidor, que então o processa
          const uploadResponse = await audioService.uploadAudio(finalAudioPathLocalM4A, sessionId);
          setIsUploading(false);
          console.log('Áudio M4A original enviado para o servidor. Resposta do servidor:', uploadResponse);

          // O backend agora processa (converte para WAV e envia para denoising) após o upload.
          // Precisamos baixar o áudio denoised.
          downloadedWavUri = await downloadProcessedAudio(sessionId);

          Alert.alert('Sucesso', 'Áudio processado e baixado! Deseja abrir a pasta?', [
            { text: 'Não', style: 'cancel' },
            {
              text: 'Sim',
              onPress: async () => {
                if (downloadedWavUri) {
                  try {
                    await Sharing.shareAsync(downloadedWavUri); // Compartilha o WAV baixado
                  } catch (error) {
                    console.error('Erro ao abrir pasta para compartilhamento:', error);
                    Alert.alert('Erro', 'Não foi possível abrir a pasta para compartilhamento');
                  }
                } else {
                  Alert.alert('Erro', 'Áudio processado não disponível para compartilhamento.');
                }
              }
            }
          ]);
        } catch (error) {
          console.error('Erro no processamento, upload ou download:', error);
          setUploadError(error instanceof Error ? error.message : 'Erro desconhecido');
          Alert.alert('Erro', 'Não foi possível processar ou baixar o áudio');
        } finally {
          setIsProcessing(false);
          setSessionId(null);
          sessionDirectory.current = null;
          // Limpa o arquivo de áudio M4A original local
          if (finalAudioPathLocalM4A) {
            try {
              await FileSystem.deleteAsync(finalAudioPathLocalM4A);
              console.log('Áudio M4A original local deletado:', finalAudioPathLocalM4A);
            } catch (error) {
              console.warn('Erro ao deletar arquivo M4A local:', error);
            }
          }
          // O arquivo WAV baixado permanece para compartilhamento/reprodução até ser explicitamente excluído.
        }
      }
    } catch (err) {
      console.error('Erro ao parar gravação:', err);
      Alert.alert('Erro', 'Falha ao parar a gravação');
    }
  }

  /**
   * Formata o tempo em segundos para o formato MM:SS.
   * @param seconds Total de segundos.
   * @returns String de tempo formatada.
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
