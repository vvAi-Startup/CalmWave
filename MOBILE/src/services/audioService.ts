import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from '../config/api';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@CalmWave:token'; // Definindo uma chave constante para o token

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

export const audioService = {
  async uploadAudio(audioUri: string, sessionId?: string, chunkNumber: number = 0): Promise<any> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Token não encontrado');

      console.log('=== INÍCIO DO UPLOAD ===');
      console.log('URI do áudio:', audioUri);
      console.log('Número do chunk:', chunkNumber);
      console.log('Session ID:', sessionId);

      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) throw new Error('Arquivo não encontrado');

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: `chunk_${chunkNumber}.m4a`,
      } as any);
      formData.append('session_id', sessionId || '');
      formData.append('chunk_number', chunkNumber.toString());
      formData.append('is_final', 'false');

      const url = `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_AUDIO}`;
      const headers = await getAuthHeaders(); // Usando a função para obter os headers com o token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: { // <- Removendo a duplicação do header de autorização aqui
            ...headers,
            "content-type": "multipart/form-data",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao fazer upload do áudio: ${response.status} - ${errorText}`);
        }

        const responseData = await response.json();
        return { ...responseData, session_id: sessionId || responseData.session_id };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout ao fazer upload do áudio');
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      throw error;
    }
  },

  async uploadFinalChunk(audioUri: string, sessionId: string, chunkNumber: number): Promise<any> {
    try {
      console.log('=== UPLOAD DO CHUNK FINAL ===');
      console.log('URI do áudio:', audioUri);
      console.log('Número do chunk:', chunkNumber);
      console.log('Session ID:', sessionId);

      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) throw new Error('Arquivo não encontrado');

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: `chunk_${chunkNumber}.m4a`,
      } as any);
      formData.append('session_id', sessionId);
      formData.append('chunk_number', chunkNumber.toString());
      formData.append('is_final', 'true');

      const url = `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_AUDIO}`;
      const headers = await getAuthHeaders(); // Usando a função para obter os headers com o token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            ...headers,
            "content-type": "multipart/form-data",
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao fazer upload do chunk final: ${response.status} - ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout ao fazer upload do chunk final');
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro no upload do chunk final:', error);
      throw error;
    }
  },

  async processAudio(sessionId: string): Promise<any> {
    try {
      console.log('=== INÍCIO DO PROCESSAMENTO ===');
      console.log('Session ID:', sessionId);

      const url = `${API_BASE_URL}/process/${sessionId}`;
      const headers = await getAuthHeaders(); // Usando a função para obter os headers com o token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao processar o áudio: ${response.status} - ${errorText}`);
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout ao processar o áudio');
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro no processamento:', error);
      throw error;
    }
  },

  async testConnection(): Promise<boolean> {
    try {
      console.log('=== TESTANDO CONEXÃO COM A API ===');
      const url = `${API_BASE_URL}/health`;
      const headers = await getAuthHeaders(); // Usando a função para obter os headers com o token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          throw new Error(`API não está respondendo corretamente: ${response.status}`);
        }

        await response.json();
        return true;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout ao conectar com a API');
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      return false;
    }
  },
};