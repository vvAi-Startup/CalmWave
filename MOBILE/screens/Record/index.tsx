import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import { styles } from "./styles";
import { Nav } from "../../components/Nav";
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { audioService } from '../../src/services/audioService';

export default function RecordScreen() {
  const [waveform, setWaveform] = useState<number[]>([]);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  
  const chunkInterval = useRef<NodeJS.Timeout | null>(null);
  const lastChunkTime = useRef<number>(0);
  const chunkNumber = useRef<number>(0);
  const lastChunkUri = useRef<string | null>(null);
  const uploadQueue = useRef<boolean>(false);
  const sessionDirectory = useRef<string | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

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
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (!isRecording && interval) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  useEffect(() => {
    checkApiConnection();
  }, []);

  useEffect(() => {
    // Atualizar a referência quando o recording mudar
    recordingRef.current = recording;
  }, [recording]);

  const checkApiConnection = async () => {
    try {
      setIsCheckingConnection(true);
      const connected = await audioService.testConnection();
      setIsConnected(connected);
      if (!connected) {
        Alert.alert(
          'Erro de Conexão',
          'Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao verificar conexão:', error);
      setIsConnected(false);
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível conectar com o servidor. Verifique sua conexão e tente novamente.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const processAudioChunk = async () => {
    const currentRecording = recordingRef.current;
    if (!currentRecording || isUploading || uploadQueue.current) {
      console.log('Pulando processamento:', {
        hasRecording: !!currentRecording,
        isUploading,
        uploadQueue: uploadQueue.current
      });
      return;
    }

    try {
      uploadQueue.current = true;
      setIsUploading(true);
      setUploadError(null);

      const currentUri = await currentRecording.getURI();
      if (!currentUri) {
        throw new Error('URI do áudio não encontrada');
      }

      console.log('Processando chunk:', {
        uri: currentUri,
        chunkNumber: chunkNumber.current,
        sessionId
      });

      // Criar diretório da sessão se não existir
      if (!sessionDirectory.current) {
        const sessionDir = `${FileSystem.documentDirectory}audios/session_${Date.now()}`;
        await FileSystem.makeDirectoryAsync(sessionDir, { intermediates: true });
        sessionDirectory.current = sessionDir;
      }

      const chunkFileName = `chunk_${chunkNumber.current}.m4a`;
      const chunkUri = `${sessionDirectory.current}/${chunkFileName}`;

      // Copiar o áudio atual para o novo arquivo
      await FileSystem.copyAsync({
        from: currentUri,
        to: chunkUri
      });

      const fileInfo = await FileSystem.getInfoAsync(chunkUri);
      if (!fileInfo.exists) {
        throw new Error('Arquivo do chunk não foi criado corretamente');
      }

      // Fazer upload do chunk
      const uploadResponse = await audioService.uploadAudio(
        chunkUri,
        sessionId || undefined,
        chunkNumber.current
      );

      if (uploadResponse.session_id) {
        if (!sessionId) {
          console.log('Nova sessão criada:', uploadResponse.session_id);
        } else if (sessionId !== uploadResponse.session_id) {
          console.log('Atualizando session ID:', uploadResponse.session_id);
        }
        setSessionId(uploadResponse.session_id);
      }

      // Deletar o chunk anterior se existir
      if (lastChunkUri.current) {
        try {
          await FileSystem.deleteAsync(lastChunkUri.current);
        } catch (error) {
          console.warn('Erro ao deletar chunk anterior:', error);
        }
      }

      lastChunkUri.current = chunkUri;
      chunkNumber.current += 1;
      lastChunkTime.current = Date.now();
      console.log('Chunk processado com sucesso:', {
        chunkNumber: chunkNumber.current - 1,
        newLastChunkTime: lastChunkTime.current
      });

    } catch (error) {
      console.error('Erro ao processar chunk:', error);
      setUploadError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setIsUploading(false);
      uploadQueue.current = false;
    }
  };

  async function startRecording() {
    if (!isConnected) {
      Alert.alert(
        'Erro de Conexão',
        'Não foi possível conectar com o servidor. Deseja tentar novamente?',
        [
          {
            text: 'Não',
            style: 'cancel'
          },
          {
            text: 'Sim',
            onPress: checkApiConnection
          }
        ]
      );
      return;
    }

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

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(newRecording);
      recordingRef.current = newRecording;
      setIsRecording(true);
      setTimer(0);
      setSessionId(null);
      lastChunkTime.current = Date.now();
      chunkNumber.current = 0;
      lastChunkUri.current = null;
      sessionDirectory.current = null;
      setUploadError(null);

      // Verificar a cada 2 segundos se precisa enviar um novo chunk
      chunkInterval.current = setInterval(async () => {
        if (recordingRef.current && !isUploading && !uploadQueue.current) {
          const currentTime = Date.now();
          console.log('Verificando chunks:', {
            currentTime,
            lastChunkTime: lastChunkTime.current,
            diff: currentTime - lastChunkTime.current,
            isUploading,
            uploadQueue: uploadQueue.current
          });
          
          if (currentTime - lastChunkTime.current >= 5000) {
            console.log('Iniciando processamento do chunk...');
            await processAudioChunk();
          }
        }
      }, 2000);

    } catch (err) {
      console.error('Falha ao iniciar gravação', err);
      Alert.alert('Erro', 'Não foi possível iniciar a gravação');
    }
  }

  async function stopRecording() {
    if (!recording) return;

    try {
      // Limpar o intervalo de chunks
      if (chunkInterval.current) {
        clearInterval(chunkInterval.current);
        chunkInterval.current = null;
      }

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioUri(uri);
      setRecording(null);
      setIsRecording(false);

      if (uri && sessionId && sessionDirectory.current) {
        setIsProcessing(true);
        try {
          // Processar o último chunk
          const finalChunkUri = `${sessionDirectory.current}/chunk_${chunkNumber.current}.m4a`;
          await FileSystem.copyAsync({
            from: uri,
            to: finalChunkUri
          });

          // Enviar o chunk final
          await audioService.uploadFinalChunk(finalChunkUri, sessionId, chunkNumber.current);

          // Processar o áudio completo
          const processResponse = await audioService.processAudio(sessionId);
          console.log('Resposta do processamento:', processResponse);
          
          Alert.alert(
            'Sucesso', 
            'Áudio processado com sucesso! Deseja abrir a pasta?',
            [
              {
                text: 'Não',
                style: 'cancel'
              },
              {
                text: 'Sim',
                onPress: async () => {
                  try {
                    await Sharing.shareAsync(finalChunkUri);
                  } catch (error) {
                    console.error('Erro ao abrir pasta:', error);
                    Alert.alert('Erro', 'Não foi possível abrir a pasta');
                  }
                }
              }
            ]
          );
        } catch (error) {
          console.error('Erro no processamento:', error);
          Alert.alert('Erro', 'Não foi possível processar o áudio');
        } finally {
          setIsProcessing(false);
          setSessionId(null);
          sessionDirectory.current = null;
          
          // Limpar o último chunk
          if (lastChunkUri.current) {
            try {
              await FileSystem.deleteAsync(lastChunkUri.current);
            } catch (error) {
              console.warn('Erro ao deletar último chunk:', error);
            }
          }
        }
      }
    } catch (err) {
      console.error('Falha ao parar gravação:', err);
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
        <TouchableOpacity 
          style={styles.recordButton}
          onPress={startRecording}
          disabled={isProcessing}
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
          disabled={isProcessing}
        >
          <View style={styles.stopButtonOuter}>
            <View style={styles.stopButtonInner}>
              <View style={styles.stopButtonSquad}></View>
            </View>
          </View>
        </TouchableOpacity>
        {isRecording && (
          <Text style={styles.timerText}>{formatTime(timer)}</Text>
        )}
        {isProcessing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#0000ff" />
            <Text style={styles.processingText}>Processando áudio...</Text>
          </View>
        )}
        {uploadError && (
          <Text style={styles.errorText}>{uploadError}</Text>
        )}
        {isUploading && (
          <Text style={styles.uploadingText}>Enviando áudio...</Text>
        )}
      </View>
      <Nav/>
    </View>
  );
}
