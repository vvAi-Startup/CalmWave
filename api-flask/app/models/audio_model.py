# app/models/audio_model.py
from bson.objectid import ObjectId
from datetime import datetime
from app.extensions import logger 
from flask import current_app # Importa current_app

class AudioModel:
    def __init__(self, db_instance): # Aceita a instância do DB
        if db_instance is None:
            logger.error("A instância do banco de dados (db_instance) é None ao inicializar AudioModel.")
            raise RuntimeError("MongoDB database 'db' not initialized. Pass a valid db_instance.")
        # Não precisamos armazenar a instância 'app' aqui, apenas a instância 'db'
        self.db = db_instance 
        self.collection = self.db['audios'] # Acessa a coleção a partir da instância passada
        logger.debug("AudioModel initialized and connected to 'audios' collection.")

    def create(self, data):
        data["created_at"] = datetime.utcnow()
        data["last_updated_at"] = datetime.utcnow()
        result = self.collection.insert_one(data)
        logger.info(f"MongoDB document INSERTED. ID: {result.inserted_id}")
        return str(result.inserted_id)

    def find_one(self, query):
        doc = self.collection.find_one(query)
        if doc:
            doc['_id'] = str(doc['_id'])
        return doc

    def update_one(self, query, data, upsert=False):
        data["last_updated_at"] = datetime.utcnow()
        result = self.collection.update_one(query, {"$set": data}, upsert=upsert)
        if result.upserted_id:
            logger.info(f"MongoDB document INSERTED (upsert). ID: {result.upserted_id}")
        elif result.modified_count > 0:
            logger.info(f"MongoDB document UPDATED.")
        else:
            logger.warning(f"MongoDB document NOT INSERTED/UPDATED for query: {query}")
        return result

    def find_all(self, query=None):
        if query is None:
            query = {}
        docs = list(self.collection.find(query))
        for doc in docs:
            doc['_id'] = str(doc['_id'])
        return docs

    def delete_one(self, query):
        result = self.collection.delete_one(query)
        logger.info(f"Documents deleted: {result.deleted_count}")
        return result.deleted_count > 0
