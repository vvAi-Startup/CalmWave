# app/models/audio_model.py
from bson import ObjectId
from datetime import datetime
from app.extensions import logger 
from flask import current_app # Importa current_app

class AudioModel:
    def __init__(self, db_instance):
        if db_instance is None:
            raise ValueError("Database instance is required")
        self.db = db_instance
        self.audios_collection = self.db['audios']
        logger.debug("AudioModel initialized and connected to 'audios' collection.")

    def create(self, audio_data):
        """Cria um novo registro de áudio."""
        try:
            audio_data["created_at"] = datetime.utcnow()
            audio_data["last_updated_at"] = datetime.utcnow()
            result = self.audios_collection.insert_one(audio_data)
            logger.info(f"MongoDB document INSERTED. ID: {result.inserted_id}")
            return result.inserted_id
        except Exception as e:
            logger.error(f"Erro ao criar registro de áudio: {str(e)}")
            return None

    def find_one(self, query):
        """Busca um registro de áudio."""
        try:
            doc = self.audios_collection.find_one(query)
            if doc:
                doc['_id'] = str(doc['_id'])
            return doc
        except Exception as e:
            logger.error(f"Erro ao buscar registro de áudio: {str(e)}")
            return None

    def update_one(self, query, update_data):
        """Atualiza um registro de áudio."""
        try:
            update_data["last_updated_at"] = datetime.utcnow()
            result = self.audios_collection.update_one(
                query,
                {"$set": update_data}
            )
            if result.upserted_id:
                logger.info(f"MongoDB document INSERTED (upsert). ID: {result.upserted_id}")
            elif result.modified_count > 0:
                logger.info(f"MongoDB document UPDATED.")
            else:
                logger.warning(f"MongoDB document NOT INSERTED/UPDATED for query: {query}")
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Erro ao atualizar registro de áudio: {str(e)}")
            return None

    def find_all(self, query=None):
        """Lista todos os registros de áudio."""
        try:
            if query is None:
                query = {}
            docs = list(self.audios_collection.find(query))
            for doc in docs:
                doc['_id'] = str(doc['_id'])
            return docs
        except Exception as e:
            logger.error(f"Erro ao listar registros de áudio: {str(e)}")
            return []

    def delete_one(self, query):
        """Remove um registro de áudio."""
        try:
            result = self.audios_collection.delete_one(query)
            logger.info(f"Documents deleted: {result.deleted_count}")
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Erro ao deletar registro de áudio: {str(e)}")
            return None

    def find_by_upload_id(self, upload_id):
        """Busca um registro de áudio pelo upload_id."""
        try:
            return self.audios_collection.find_one({"upload_id": upload_id})
        except Exception as e:
            logger.error(f"Erro ao buscar registro de áudio por upload_id: {str(e)}")
            return None

    def find_by_status(self, status):
        """Busca registros de áudio por status."""
        try:
            return list(self.audios_collection.find({"status": status}))
        except Exception as e:
            logger.error(f"Erro ao buscar registros de áudio por status: {str(e)}")
            return []
