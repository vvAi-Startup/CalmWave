import jwt
import time
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app # Importa current_app

from app.models import UserModel
from app.schemas.user_schema import UserSchema, UserRegistrationSchema, UserLoginSchema, TokenSchema
from app.extensions import logger 


class AuthService:
    def __init__(self, db_instance):
        self.db = db_instance
        self.user_model = UserModel(self.db)
        self.secret_key = current_app.config['SECRET_KEY'] # Access config via current_app

    def generate_token(self, user_id):
        """
        Generates a JWT token for the user.
        """
        payload = {
            'user_id': user_id,
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        return jwt.encode(payload, self.secret_key, algorithm='HS256')

    def verify_token(self, token):
        """
        Verifies if a JWT token is valid.
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=['HS256'])
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning("Token expired.")
            return None
        except jwt.InvalidTokenError:
            logger.warning("Invalid token.")
            return None

    def register_user(self, email, password, name=None):
        """Registra um novo usuário."""
        try:
            # Verifica se o usuário já existe
            existing_user = self.user_model.find_by_email(email)
            if existing_user:
                return {
                    "success": False,
                    "message": "Email já cadastrado"
                }

            # Cria o novo usuário
            user_data = {
                "email": email,
                "password": generate_password_hash(password),
                "name": name,
                "created_at": time.time(),
                "last_login": None
            }

            result = self.user_model.create(user_data)
            if result:
                return {
                    "success": True,
                    "message": "Usuário registrado com sucesso"
                }
            else:
                return {
                    "success": False,
                    "message": "Erro ao registrar usuário"
                }

        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {str(e)}")
            return {
                "success": False,
                "message": "Erro interno ao registrar usuário"
            }

    def login_user(self, email, password):
        """Autentica um usuário e retorna um token JWT."""
        try:
            # Busca o usuário pelo email
            user = self.user_model.find_by_email(email)
            if not user:
                return {
                    "success": False,
                    "message": "Usuário não encontrado"
                }

            # Verifica a senha
            if not check_password_hash(user['password'], password):
                return {
                    "success": False,
                    "message": "Senha incorreta"
                }

            # Gera o token JWT
            token = self.generate_token(user['_id'])

            # Atualiza o último login
            self.user_model.update_one(
                {"_id": user["_id"]},
                {"last_login": time.time()}
            )

            return {
                "success": True,
                "token": token,
                "user": {
                    "id": str(user["_id"]),
                    "email": user["email"],
                    "name": user.get("name")
                }
            }

        except Exception as e:
            logger.error(f"Erro ao fazer login: {str(e)}")
            return {
                "success": False,
                "message": "Erro interno ao fazer login"
            }

    def get_user_from_token(self, token_header):
        """
        Extracts the user ID from the token in the Authorization header.
        """
        if not token_header:
            return None, "Token not provided"
        
        # Assume token_header is "Bearer <token>"
        parts = token_header.split()
        if len(parts) == 2 and parts[0].lower() == 'bearer':
            token = parts[1]
        else:
            return None, "Invalid token format"

        payload = self.verify_token(token)
        if not payload:
            return None, "Invalid or expired token"
        
        user_id = payload.get('user_id')
        if not user_id:
            return None, "User ID not found in token"
        
        user = self.user_model.find_by_id(user_id)
        if not user:
            return None, "User associated with token not found"
        
        return user, None

    def get_user_by_id(self, user_id):
        """Busca um usuário pelo ID."""
        try:
            return self.user_model.find_by_id(user_id)
        except Exception as e:
            logger.error(f"Erro ao buscar usuário: {str(e)}")
            return None

    def update_user(self, user_id, update_data):
        """Atualiza os dados de um usuário."""
        try:
            # Remove campos sensíveis
            if "password" in update_data:
                update_data["password"] = generate_password_hash(update_data["password"])
            
            update_data["last_updated_at"] = time.time()
            
            result = self.user_model.update_one(
                {"_id": user_id},
                update_data
            )
            
            return result is not None

        except Exception as e:
            logger.error(f"Erro ao atualizar usuário: {str(e)}")
            return False

    def delete_user(self, user_id):
        """Remove um usuário."""
        try:
            result = self.user_model.delete_one({"_id": user_id})
            return result is not None
        except Exception as e:
            logger.error(f"Erro ao deletar usuário: {str(e)}")
            return False
