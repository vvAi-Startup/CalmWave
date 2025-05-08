import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT, DEFAULT_HEADERS } from '../config/api';
import * as FileSystem from 'expo-file-system';

export const audioService = {
  async uploadAudio(audioUri: string, sessionId?: string, chunkNumber: number = 0): Promise<any> {
    try {
      console.log('=== INÍCIO DO UPLOAD ===');
      console.log('URI do áudio:', audioUri);
      console.log('Número do chunk:', chunkNumber);
      console.log('Session ID:', sessionId);

      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Arquivo não encontrado');
      }

      console.log('Informações do arquivo:', {
        exists: fileInfo.exists,
        size: fileInfo.size,
        uri: fileInfo.uri
      });

      const formData = new FormData();
      const audioFile = {
        uri: audioUri,
        type: 'audio/m4a',
        name: `chunk_${chunkNumber}.m4a`,
      };
      console.log('Arquivo de áudio:', audioFile);
      
      formData.append('audio', audioFile as any);
      formData.append('session_id', sessionId || '');
      formData.append('chunk_number', chunkNumber.toString());
      formData.append('is_final', 'false');

      const url = `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_AUDIO}`;
      console.log('URL da requisição:', url);
      console.log('Headers:', DEFAULT_HEADERS);
      console.log('FormData:', formData);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: DEFAULT_HEADERS,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('Status da resposta:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Erro ao fazer upload do áudio: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Resposta do servidor:', responseData);

        return {
          ...responseData,
          session_id: sessionId || responseData.session_id
        };
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
      if (!fileInfo.exists) {
        throw new Error('Arquivo não encontrado');
      }

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: DEFAULT_HEADERS,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Erro ao fazer upload do chunk final: ${response.status}`);
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
      console.log('URL do processamento:', url);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('Status da resposta:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Erro ao processar o áudio: ${response.status}`);
        }

        const data = await response.json();
        console.log('Resposta do processamento:', data);
        console.log('=== FIM DO PROCESSAMENTO ===');
        return data;
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
      console.log('URL base:', API_BASE_URL);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      try {
        const response = await fetch(`${API_BASE_URL}/health`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('Status da resposta:', response.status);

        if (!response.ok) {
          throw new Error(`API não está respondendo corretamente: ${response.status}`);
        }

        const data = await response.json();
        console.log('Resposta da API:', data);
        console.log('=== CONEXÃO ESTABELECIDA ===');
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