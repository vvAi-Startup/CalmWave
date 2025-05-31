from pymongo import MongoClient
from marshmallow import Marshmallow
import logging
import os

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
        ]
)
logger = logging.getLogger(__name__)


# Extensões do Flask
MongoClient = None # Sera iniciado em __init__.py
db = None
audio_collection = None
users_collection = None


def init_mongo(app):
    global MongoClient, db, audio_collection, users_collection
    try:
        mongo_uri = app.config['MONGO_URI']
        Mongo_client = MongoClient(mongo_uri)
        db = Mongo_client['calmwave']
        audio_collection = db['audios']
        users_collection = db['users']
        
        if 'users' not in db.list_collection_names():
            db.create_collection('users')
            logger.info("Collection 'users' created in MongoDB.")
            
        logger.info("MongoDB connection established successfully.")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}", exc_info=True)
        raise