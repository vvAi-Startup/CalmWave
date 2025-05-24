import {API_URL} from '@env'
// URL base da API
export const API_BASE_URL = API_URL ;

export const API_ENDPOINTS = {
  UPLOAD_AUDIO: '/upload',
  PROCESS_AUDIO: '/process',
  GET_STATUS: '/status',
  GET_AUDIO: '/audio',
  STREAM_AUDIO: '/stream',
  CLEANUP: '/cleanup',
  LIST_AUDIOS: '/audios/list',
};

// Configuração do timeout para requisições
export const API_TIMEOUT = 30000; // 30 segundos

// Configuração dos headers padrão
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'multipart/form-data',
}; 
