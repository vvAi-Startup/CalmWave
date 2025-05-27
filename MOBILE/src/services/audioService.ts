// src/services/audioService.ts
import { API_BASE_URL, API_ENDPOINTS, API_TIMEOUT } from '../config/api';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
 
const AUTH_TOKEN_KEY = '@CalmWave:token'; // Define a constant key for the token
 
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  // Adaptação: Se não houver token, retornar um objeto vazio ou lançar erro dependendo da sua política
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token || ''}`, // Garante que não é 'null' ou 'undefined'
  };
}
 
/**
 * Define o tipo para um item de áudio retornado pela API.
 * Adicionamos o campo 'status' que agora é retornado pelo backend.
 */
export type AudioListItem = {
  id: string; // ID do MongoDB (_id)
  session_id: string;
  title: string;
  path?: string; // URL para o arquivo WAV processado (ou temporário, dependendo do status). Tornamos opcional.
  created_at: number; // Timestamp de criação
  status: string; // Novo campo: o status atual do processamento do áudio (ex: "processed", "denoise_failed")
};
 
/**
 * Define o tipo para a resposta do upload de áudio.
 * Inclui campos para o status do serviço de denoising.
 */
export type UploadResponse = {
  session_id: string;
  message: string;
  denoise_service_status: 'success' | 'denoise_send_failed' | 'denoise_processing_failed' | string; // Explicitamos os possíveis status
  denoise_service_message?: string; // Mensagem detalhada do serviço de denoising (opcional)
  processed_audio_path?: string; // Novo campo: o path para o áudio processado, se bem-sucedido
};
 
export const audioService = {
  /**
   * Faz o upload do arquivo de áudio final (M4A) para o servidor.
   * A API agora processa (converte para WAV e envia para denoising) automaticamente após o upload.
   * @param audioUri URI local do arquivo de áudio final.
   * @param sessionId ID da sessão à qual o áudio pertence.
   * @returns Resposta da API, incluindo o status do denoising e, se bem-sucedido, o caminho do áudio processado.
   */
  async uploadAudio(audioUri: string, sessionId?: string): Promise<UploadResponse> {
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
      formData.append('chunk_number', '0');
      formData.append('is_final', 'true');
 
      const url = `${API_BASE_URL}${API_ENDPOINTS.UPLOAD_AUDIO}`;
      console.log('URL de Upload:', url); // Log para depuração
      const headers = await getAuthHeaders();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
 
      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            ...headers,
            "content-type": "multipart/form-data", // Importante para FormData
          },
          signal: controller.signal,
        });
 
        clearTimeout(timeoutId);
        if (!response.ok) {
          const errorText = await response.text();
          // Tentar parsear o erro como JSON se possível, caso contrário usar texto
          try {
            const errorJson = JSON.parse(errorText);
            throw new Error(`Erro ao fazer upload do áudio: ${response.status} - ${errorJson.message || errorText}`);
          } catch {
            throw new Error(`Erro ao fazer upload do áudio: ${response.status} - ${errorText}`);
          }
        }
 
        const responseData: UploadResponse = await response.json();
        // O backend deve retornar 'processed_audio_path' em caso de sucesso no denoising
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
   * Baixa o arquivo de áudio WAV processado do backend.
   * Não requer autenticação.
   * @param path A URL completa do áudio a ser baixado (já deve ser o path do áudio processado)
   * @returns O URI local do arquivo WAV baixado.
   */
  async downloadAudio(path: string): Promise<string> {
    try {
      // Extrai o nome do arquivo da URL para o nome local
      const fileName = path.split('/').pop()?.split('?')[0];
      const localUri = `${FileSystem.documentDirectory}audios/downloaded_processed_${fileName}.wav`;
 
      console.log(`Tentando baixar de: ${path} para ${localUri}`);
 
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
 
      try {
        const { uri, status } = await FileSystem.downloadAsync(path, localUri);
 
        clearTimeout(timeoutId);
 
        if (status !== 200) {
          let errorBody = 'Unknown error';
          // Tenta ler o corpo da resposta de erro apenas se o status não for 200
          try {
            const responseText = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.UTF8 });
            errorBody = responseText;
          } catch (readError) {
            console.warn('Não foi possível ler o corpo da resposta de erro:', readError);
          }
          console.error('Download falhou com status:', status, 'Resposta de erro:', errorBody);
          throw new Error(`Falha ao baixar áudio processado: Servidor respondeu com status ${status}. ${errorBody}`);
        }
 
        console.log('Áudio processado baixado para:', uri);
        return uri;
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout ao baixar o áudio');
        }
        throw error;
      }
    } catch (error) {
      console.error('Erro no download:', error);
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
      const url = `${API_BASE_URL}${API_ENDPOINTS.HEALTH_CHECK}`;
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
 
        await response.json(); // Consumir a resposta JSON, mesmo que vazia
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
   * Lista todos os áudios disponíveis, incluindo seu status de processamento.
   * Não requer autenticação.
   * @returns Uma promessa que resolve para uma lista de AudioListItem.
   */
  async listAudios(): Promise<AudioListItem[]> {
    try {
      const url = `${API_BASE_URL}${API_ENDPOINTS.LIST_AUDIOS}`;
      console.log('URL de listagem:', url); // Log para depuração
     
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);
 
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
 
        clearTimeout(timeoutId);
       
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', response.status, errorText);
          throw new Error(`Erro ao listar áudios: ${response.status} - ${errorText}`);
        }
 
        const data = await response.json();
        console.log('Resposta da API:', JSON.stringify(data, null, 2)); // Log detalhado
 
        if (!data || typeof data !== 'object') {
          console.error('Resposta inválida da API:', data);
          return [];
        }
 
        if (!data.data || !Array.isArray(data.data)) {
          console.log('Nenhum áudio encontrado ou formato inválido');
          return [];
        }
 
        return data.data.map((audio: any) => {
          // Log para depuração de cada áudio
          console.log('Processando áudio:', JSON.stringify(audio, null, 2));
 
          // Constrói a URL do áudio
          let audioUrl = audio.path;
          if (!audioUrl) {
            console.warn('Áudio sem path:', audio);
            return null;
          }
 
          // Se o path não começa com http, adiciona a URL base
          if (!audioUrl.startsWith('http')) {
            audioUrl = `${API_BASE_URL}${audioUrl.startsWith('/') ? '' : '/'}${audioUrl}`;
          }
 
          // Extrai o nome do arquivo para usar como título se necessário
          const filename = audio.filename || audio.path.split('/').pop() || 'Áudio sem nome';
          const title = audio.title || filename.replace(/\.[^/.]+$/, ''); // Remove extensão
 
          return {
            id: audio.id || String(Math.random()), // Garante um ID único
            session_id: audio.session_id || audio.id || String(Math.random()),
            title: title || 'Áudio sem título',
            path: audioUrl,
            created_at: audio.created_at || Date.now(),
            status: audio.status || 'processed'
          };
        }).filter(Boolean); // Remove itens nulos
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Timeout ao listar áudios');
        }
        console.error('Erro ao processar resposta:', error);
        throw error;
      }
    } catch (error) {
      console.error('Erro ao listar áudios:', error);
      throw error;
    }
  },
 
  /**
   * Deleta um áudio do servidor.
   * @param sessionId O ID da sessão do áudio a ser deletado.
   * @returns Resposta da API.
   */
  async deleteAudio(sessionId: string): Promise<any> {
    try {
      // Adição de validação para garantir que session_id não está vazio
      if (!sessionId) {
        console.warn('Tentativa de deletar áudio sem session_id fornecido.');
        throw new Error('Session ID é necessário para deletar o áudio.');
      }
 
      const url = `${API_BASE_URL}${API_ENDPOINTS.DELETE_AUDIO}/${sessionId}`;
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