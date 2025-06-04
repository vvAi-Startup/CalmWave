from pymongo import MongoClient
import logging

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

mongo_client = None
db = None

def init_mongo(app):
    global mongo_client, db
    try:
        mongo_uri = app.config['MONGO_URI']
        mongo_client = MongoClient(mongo_uri)
        db = mongo_client['calmwave']

        if 'users' not in db.list_collection_names():
            db.create_collection('users')
            logger.info("Coleção 'users' criada no MongoDB.")

        logger.info("Conectado ao MongoDB com sucesso.")
    except Exception as e:
        logger.error(f"Erro ao conectar ao MongoDB: {str(e)}", exc_info=True)
        raise
