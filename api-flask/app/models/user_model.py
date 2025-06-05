# app/models/user_model.py
from bson import ObjectId
from app.extensions import logger
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app # Importa current_app

class UserModel:
    def __init__(self, db_instance):
        if db_instance is None:
            raise ValueError("Database instance is required")
        self.db = db_instance
        self.users_collection = self.db['users']
        logger.debug("UserModel initialized and connected to 'users' collection.")

    def create(self, user_data):
        """Cria um novo usuário."""
        try:
            result = self.users_collection.insert_one(user_data)
            logger.info(f"User created with ID: {result.inserted_id}")
            return result.inserted_id
        except Exception as e:
            logger.error(f"Erro ao criar usuário: {str(e)}")
            return None

    def find_by_email(self, email):
        """Busca um usuário pelo email."""
        try:
            return self.users_collection.find_one({"email": email})
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por email: {str(e)}")
            return None

    def find_by_id(self, user_id):
        """Busca um usuário pelo ID."""
        try:
            if isinstance(user_id, str):
                user_id = ObjectId(user_id)
            return self.users_collection.find_one({"_id": user_id})
        except Exception as e:
            logger.error(f"Erro ao buscar usuário por ID: {str(e)}")
            return None

    def update_one(self, query, update_data):
        """Atualiza um usuário."""
        try:
            result = self.users_collection.update_one(
                query,
                {"$set": update_data}
            )
            return result.modified_count > 0
        except Exception as e:
            logger.error(f"Erro ao atualizar usuário: {str(e)}")
            return None

    def delete_one(self, query):
        """Remove um usuário."""
        try:
            result = self.users_collection.delete_one(query)
            return result.deleted_count > 0
        except Exception as e:
            logger.error(f"Erro ao deletar usuário: {str(e)}")
            return None

    def find_all(self, query=None):
        """Lista todos os usuários."""
        try:
            if query is None:
                query = {}
            return list(self.users_collection.find(query))
        except Exception as e:
            logger.error(f"Erro ao listar usuários: {str(e)}")
            return []

    # You can add more methods here (e.g., update_user, delete_user)
