import os
from datetime import timedelta

class Config:
    # Configurações do MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    
    # Segurança
    SECRET_KEY = os.getenv('SECRET_KEY')  # Removido valor padrão
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Serviços
    DENOISE_SERVER = os.getenv('DENOISE_SERVER', 'http://localhost:5000')
    
    # Diretórios
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads') # Caminho para M4A original
    TEMP_WAV_FOLDER = os.path.join(os.getcwd(), 'temp_wavs') # Caminho para WAV temporário
    PROCESSED_FOLDER = os.path.join(os.getcwd(), 'processed') # Caminho para áudio final processado
    
    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # URLs
    BASE_URL = os.getenv('BASE_URL', 'http://127.0.0.1:5000') # Adicionado BASE_URL
    
    # Segurança de Upload
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max-limit
    ALLOWED_EXTENSIONS = {'m4a', 'wav', 'mp3'}
    
    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    # Rate Limiting
    RATELIMIT_DEFAULT = "200 per day;50 per hour"
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # Timeouts
    REQUEST_TIMEOUT = 30  # segundos
