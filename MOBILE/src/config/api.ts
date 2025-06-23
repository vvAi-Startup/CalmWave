// import {API_URL} from '../../.env'
// URL base da API
export const API_BASE_URL = 'http://10.67.57.147:5000';

export const API_ENDPOINTS = {
  UPLOAD_AUDIO: '/upload',
  PROCESS_AUDIO: '/process',
  GET_STATUS: '/status',
  GET_AUDIO: '/audio',
  STREAM_AUDIO: '/stream',
  CLEANUP: '/cleanup',
  LIST_AUDIOS: '/list',
  HEALTH_CHECK: '/health',
  DELETE_AUDIO: '/delete',
};

// Configuração do timeout para requisições
export const API_TIMEOUT = 30000; // 30 segundos

// Configuração dos headers padrão
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
};

// Configuração de tipos de mídia aceitos
export const ACCEPTED_AUDIO_TYPES = {
  'audio/wav': '.wav',
  'audio/m4a': '.m4a',
  'audio/mpeg': '.mp3',
}; 
