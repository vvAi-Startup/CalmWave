import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from flask import current_app # Importa current_app

from app.models import UserModel
from app.schemas.user_schema import UserSchema, UserRegistrationSchema, UserLoginSchema, TokenSchema
from app.extensions import logger 


class AuthService:
    def __init__(self, db_instance): # Parameter renamed for clarity, receives db instance
        # self.app = db_instance # Storing db_instance as self.app can be misleading
        self.user_model = UserModel(db_instance) # Pass db_instance directly to UserModel
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

    def register_user(self, data):
        """
        Registers a new user.
        """
        schema = UserRegistrationSchema()
        try:
            user_data = schema.load(data)
        except Exception as e:
            logger.error(f"Validation error during registration: {e.messages}")
            return {"message": "Invalid registration data", "errors": e.messages}, 400

        if self.user_model.find_by_email(user_data['email']):
            return {"message": "Email is already in use"}, 400

        hashed_password = generate_password_hash(user_data['password'], method='pbkdf2:sha256')
        new_user_data = {
            'name': user_data['name'],
            'email': user_data['email'],
            'password': hashed_password
        }

        user_id = self.user_model.create_user(new_user_data)
        
        # Fetch the created user to ensure all fields are present for token generation
        created_user = self.user_model.find_by_id(user_id)
        if not created_user:
            logger.error(f"Failed to retrieve created user with ID: {user_id}")
            return {"message": "Error creating user, please try again."}, 500

        token = self.generate_token(user_id)
        
        return TokenSchema().dump({
            'token': token,
            'user': {
                'id': created_user['_id'],
                'name': created_user['name'],
                'email': created_user['email']
            }
        }), 201

    def login_user(self, data):
        """
        Logs in a user.
        """
        schema = UserLoginSchema()
        try:
            login_data = schema.load(data)
        except Exception as e:
            logger.error(f"Validation error during login: {e.messages}")
            return {"message": "Invalid login data", "errors": e.messages}, 400

        user = self.user_model.find_by_email(login_data['email'])
        if not user:
            return {"message": "User not found"}, 404

        if not check_password_hash(user['password'], login_data['password']):
            return {"message": "Incorrect password"}, 401

        token = self.generate_token(user['_id'])
        return TokenSchema().dump({
            'token': token,
            'user': {
                'id': user['_id'],
                'name': user['name'],
                'email': user['email']
            }
        }), 200

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
