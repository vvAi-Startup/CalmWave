
// URL base da API
export const API_BASE_URL = 'http://10.67.57.147:5000';

export const API_ENDPOINTS = {
  UPLOAD_AUDIO: '/upload',
  PROCESS_AUDIO: '/process',
  GET_STATUS: '/status',
  GET_AUDIO: '/audio',
  STREAM_AUDIO: '/stream',
  CLEANUP: '/cleanup'
};

// Configuração do timeout para requisições
export const API_TIMEOUT = 30000; // 30 segundos

// Configuração dos headers padrão
export const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'multipart/form-data',
}; 
