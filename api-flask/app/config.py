import os

class Config:
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    SECRET_KEY = os.getenv('SECRET_KEY', 'secret_key')
    DENOISE_SERVER = os.getenv('DENOISE_SERVER', 'http://localhost:5000')
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'uploads') # Caminho para M4A original
    TEMP_WAV_FOLDER = os.path.join(os.getcwd(), 'temp_wavs') # Caminho para WAV temporário
    PROCESSED_FOLDER = os.path.join(os.getcwd(), 'processed') # Caminho para áudio final processado
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO').upper()