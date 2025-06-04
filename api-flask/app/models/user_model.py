# app/models/user_model.py
from bson.objectid import ObjectId
from app.extensions import logger 
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app # Importa current_app

class UserModel:
    def __init__(self, db_instance): # Aceita a instância do DB
        if db_instance is None:
            logger.error("A instância do banco de dados (db_instance) é None ao inicializar UserModel.")
            raise RuntimeError("MongoDB database 'db' not initialized. Pass a valid db_instance.")
        # Não precisamos armazenar a instância 'app' aqui, apenas a instância 'db'
        self.db = db_instance
        self.collection = self.db['users'] # Acessa a coleção a partir da instância passada
        logger.debug("UserModel initialized and connected to 'users' collection.")

    def find_by_email(self, email):
        """Finds a user by email."""
        user = self.collection.find_one({'email': email})
        if user:
            user['_id'] = str(user['_id'])
        return user

    def find_by_id(self, user_id):
        """Finds a user by ID."""
        try:
            user = self.collection.find_one({'_id': ObjectId(user_id)})
            if user:
                user['_id'] = str(user['_id'])
            return user
        except Exception:
            return None # Invalid ObjectId

    def create_user(self, user_data):
        """Creates a new user."""
        result = self.collection.insert_one(user_data)
        logger.info(f"User created with ID: {result.inserted_id}")
        return str(result.inserted_id)

    # You can add more methods here (e.g., update_user, delete_user)
