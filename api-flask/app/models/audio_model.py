from app.extensions import audio_collection, logger
import time 
from bson.objectid import ObjectId

class AudioModel:
    def __init__(self):
        self.collection = audio_collection
        if self.collection is None:
            raise RuntimeError("MongoDB collection 'audios' not initialized. Call init_mongo() first.")
        
        def create(self, data):
            data['created_at'] = time.time()
            data['last_updated_at'] = time.time()
            result = self.collection.insert_one(data)
            logger.info(f"Audio document created with ID: {result.inserted_id}")
            return str(result.inserted_id)
        
        def find_one(self, query):
            doc = self.collection.find_one(query)
            if doc:
                doc['_id'] = str(doc['_id']) # Converte ObjectId para string
            return doc
        
        def update_one(self, query, data, upsert=False):
            data['last_updated_at'] = time.time()
            result = self.collection.update_one(query, {'$set': data}, upsert=upsert)
            if result.upserted_id:
                logger.info(f"Documento MongoDB INSERIDO (upsert). ID: {result.upserted_id}")
            elif result.modified_count > 0:
                logger.info(f"Documento MongoDB ATUALIZADO.")
            else:
                logger.warning(f"Documento MongoDB NÃO FOI INSERIDO/ATUALIZADO para query: {query}")
            return result
        
    def find_all(self, query=None):
        if query is None:
            query = {}
        docs = list(self.collection.find(query))
        for doc in docs:
            doc['_id'] = str(doc['_id']) # Converte ObjectId para string
        return docs
    
    def delete_one(self, query):
        result = self.collection.delete_one(query)
        logger.info(f"Documentos deletados: {result.deleted_count}")
        return result.deleted_count > 0


