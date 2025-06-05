import os
import logging
from logging.handlers import RotatingFileHandler
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# Configuração do logger
logger = logging.getLogger('calmwave')
logger.setLevel(logging.INFO)

# Handler para console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_format)
logger.addHandler(console_handler)

# Variável global para a instância do banco de dados
db = None

def init_extensions(app):
    """Inicializa todas as extensões da aplicação."""
    try:
        # Configuração do CORS
        CORS(app)

        # Configuração do Rate Limiter
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=["200 per day", "50 per hour"]
        )

        # Configuração do MongoDB
        global db
        mongo_uri = app.config.get('MONGO_URI', 'mongodb://localhost:27017')
        mongo_db = app.config.get('MONGO_DATABASE', 'calmwave')

        try:
            client = MongoClient(mongo_uri)
            # Testa a conexão
            client.admin.command('ping')
            db = client[mongo_db]
            logger.info(f"Conexão com MongoDB estabelecida em {mongo_uri}")
        except ConnectionFailure as e:
            logger.error(f"Falha ao conectar ao MongoDB: {str(e)}")
            raise

        # Cria as coleções se não existirem
        collections = ['users', 'audios']
        for collection in collections:
            if collection not in db.list_collection_names():
                db.create_collection(collection)
                logger.info(f"Coleção '{collection}' criada")

        # Configuração do logger para arquivo
        if not os.path.exists('logs'):
            os.makedirs('logs')
        
        file_handler = RotatingFileHandler(
            'logs/calmwave.log',
            maxBytes=1024 * 1024,  # 1MB
            backupCount=10
        )
        file_handler.setLevel(logging.INFO)
        file_format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

        logger.info("Extensões inicializadas com sucesso")
        return db

    except Exception as e:
        logger.error(f"Erro ao inicializar extensões: {str(e)}")
        raise
