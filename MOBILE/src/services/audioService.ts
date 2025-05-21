import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from '../config/api';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@CalmWave:token'; // Define a constant key for the token

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

// Define o tipo para um item de áudio retornado pela API
export type AudioListItem = {
  id: string; // ID do MongoDB
  session_id: string;
  title: string;
  path: string; // URL para o arquivo WAV processado
  created_at: number; // Timestamp de criação
};

export const audioService = {
  /**
   * Faz o upload do arquivo de áudio final para o servidor.
   * Assume que este é sempre o arquivo de áudio completo.
   * @param audioUri URI local do arquivo de áudio final.
   * @param sessionId ID da sessão à qual o áudio pertence.
   * @returns Resposta da API.
   */
  async uploadAudio(audioUri: string, sessionId?: string): Promise<any> {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      if (!token) throw new Error('Token não encontrado');

      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) throw new Error('Arquivo não encontrado');

      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a', // Expo records in M4A by default
        name: `final_audio.m4a`, // A fixed name for the final audio file
      } as any);
      formData.append('session_id', sessionId || '');
      // chunk_number and is_final are still sent as the backend expects them,
      // but their values are fixed as we're sending the full audio.
      formData.append('chunk_number', '0'); 
      formData.append('is_final', 'true'); 

      const url = `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_AUDIO}`;
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            ...headers,
            "content-type": "multipart/form-data", // Important for FormData
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

  /**
   * Solicita ao servidor para processar o áudio de uma sessão.
   * @param sessionId ID da sessão a ser processada.
   * @returns Resposta da API.
   */
  async processAudio(sessionId: string): Promise<any> {
    try {
      const url = `${API_BASE_URL}/process/${sessionId}`;
      const headers = await getAuthHeaders();
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

  /**
   * Testa a conexão com o endpoint de saúde da API.
   * @returns Verdadeiro se a conexão for bem-sucedida, falso caso contrário.
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('=== TESTANDO CONEXÃO COM A API ===');
      const url = `${API_BASE_URL}/health`;
      const headers = await getAuthHeaders();
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

  /**
   * Lista todos os áudios processados para o usuário autenticado.
   * @returns Uma promessa que resolve para uma lista de AudioListItem.
   */
  async listAudios(): Promise<AudioListItem[]> {
    try {
      const url = `${API_BASE_URL}/audios/list`;
      const headers = await getAuthHeaders();
      const response = await fetch(url, { method: 'GET', headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao listar áudios: ${response.status} - ${errorText}`);
      }

      return await response.json(); // Retorna a lista de AudioListItem
    } catch (error) {
      console.error('Erro ao listar áudios:', error);
      throw error;
    }
  },

  /**
   * Deleta um áudio processado do servidor.
   * @param sessionId O ID da sessão do áudio a ser deletado.
   * @returns Resposta da API.
   */
  async deleteAudio(sessionId: string): Promise<any> {
    try {
      const url = `${API_BASE_URL}/audio/${sessionId}`; // O endpoint DELETE usa o mesmo caminho do GET
      const headers = await getAuthHeaders();
      const response = await fetch(url, { method: 'DELETE', headers });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ao deletar áudio: ${response.status} - ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao deletar áudio:', error);
      throw error;
    }
  },
};
