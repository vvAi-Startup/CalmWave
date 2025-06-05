import os
from dotenv import load_dotenv
from datetime import timedelta

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

class Config:
    """Configurações base da aplicação."""
    
    # Configurações do Flask
    FLASK_APP = 'run.py'
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')
    DEBUG = os.getenv('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')
    PORT = int(os.getenv('PORT', 5000))
    
    # Configurações do MongoDB
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
    MONGO_DATABASE = os.getenv('MONGO_DATABASE', 'calmwave')
    
    # Configurações de Upload
    UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')
    PROCESSED_FOLDER = os.getenv('PROCESSED_FOLDER', 'processed')
    TEMP_FOLDER = os.getenv('TEMP_FOLDER', 'temp')
    TEMP_WAV_FOLDER = os.getenv('TEMP_WAV_FOLDER', 'temp_wavs')
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_CONTENT_LENGTH', 16 * 1024 * 1024))  # 16MB
    ALLOWED_EXTENSIONS = {'wav', 'mp3', 'm4a'}
    
    # Configurações de Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    LOG_FILE = os.getenv('LOG_FILE', 'logs/calmwave.log')
    
    # Configurações de CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    CORS_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    CORS_HEADERS = ['Content-Type', 'Authorization']
    
    # Configurações de Rate Limiting
    RATELIMIT_DEFAULT = "200 per day, 50 per hour"
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # Configurações de JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', SECRET_KEY)
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Configurações do Serviço de Denoising
    DENOISE_SERVER = os.getenv('DENOISE_SERVER', 'http://localhost:8000')
    DENOISE_TIMEOUT = int(os.getenv('DENOISE_TIMEOUT', '300'))  # 5 minutos
    
    # Configurações de URL Base
    BASE_URL = os.getenv('BASE_URL', 'http://localhost:5000')
    
    @classmethod
    def init_app(cls, app):
        """Inicializa configurações específicas da aplicação."""
        # Cria diretórios necessários
        for folder in [cls.UPLOAD_FOLDER, cls.PROCESSED_FOLDER, cls.TEMP_FOLDER, cls.TEMP_WAV_FOLDER]:
            os.makedirs(folder, exist_ok=True)

        # Configura logging
        if not os.path.exists('logs'):
            os.makedirs('logs')
        
        # Configurações adicionais podem ser adicionadas aqui
        pass
