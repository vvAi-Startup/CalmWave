from flask import Blueprint, request, jsonify
from functools import wraps
import jwt
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient
from bson.objectid import ObjectId
from dotenv import load_dotenv
import os

# Configuração do MongoDB
client = MongoClient(os.getenv('MONGO_URI'))
db = client['calmwave']
users_collection = db['users']

# Verifica se a coleção de usuários existe, caso contrário, cria
if 'users' not in db.list_collection_names():
    db.create_collection('users')

# Criar blueprint para autenticação
auth_bp = Blueprint('auth', __name__)

# Chave secreta para assinatura dos tokens (em produção, usar variável de ambiente)
SECRET_KEY = "sua_chave_secreta_aqui"

def generate_token(user_id):
    """
    Gera um token JWT para o usuário.
    
    Args:
        user_id: ID do usuário
        
    Returns:
        str: Token JWT
    """
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(days=1)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm='HS256')

def verify_token(token):
    """
    Verifica se um token JWT é válido.
    
    Args:
        token: Token JWT a ser verificado
        
    Returns:
        dict: Payload do token se válido
        None: Se o token for inválido
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def token_required(f):
    """
    Decorator para proteger rotas que requerem autenticação.
    
    Args:
        f: Função a ser decorada
        
    Returns:
        function: Função decorada
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'message': 'Token não fornecido'}), 401
            
        payload = verify_token(token)
        if not payload:
            return jsonify({'message': 'Token inválido ou expirado'}), 401
            
        return f(*args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para login de usuários.
    
    Recebe credenciais e retorna um token JWT se válidas.
    
    Returns:
        JSON: Token JWT e informações do usuário
    """
    data = request.get_json()
    email = data.get('email')
    senha = data.get('password')
    if not email or not senha:
        return jsonify({'message': 'Dados incompletos'}), 400
    
    # Verifica se o usuário existe
    user = users_collection.find_one({'email': email})
    if not user:
        return jsonify({'message': 'Usuário não encontrado'}), 404
    # Verifica a senha
    if not check_password_hash(user['password'], senha):
        return jsonify({'message': 'Senha incorreta'}), 401
    # Gera o token
    token = generate_token(str(user['_id']))
    return jsonify({
        'token': token,
        'user': {
            'id': str(user['_id']),
            'name': user['name'],
            'email': user['email']
        }
    }), 200
    
    
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint para registro de novos usuários.
    
    Recebe dados do usuário e retorna um token JWT.
    
    Returns:
        JSON: Token JWT e informações do usuário
    """
    data = request.get_json()
    
    # Verifica se os dados necessários estão presentes
    nome = data.get('name')
    email = data.get('email')
    senha = data.get('password')
    if not nome or not email or not senha:
        return jsonify({'message': 'Dados incompletos'}), 400
    # Verifica se o usuário já existe
    if users_collection.find_one({'email': email}):
        return jsonify({'message': 'Email já esta em uso'}), 400
    # Cria o usuário
    hashed_password = generate_password_hash(senha, method='pbkdf2:sha256')
    new_user = {
        'name': nome,
        'email': email,
        'password': hashed_password
    }
    result = users_collection.insert_one(new_user)
    # Gera o token
    token = generate_token(str(result.inserted_id))
    return jsonify({
        'token': token,
        'user': {
            'id': str(result.inserted_id),
            'name': nome,
            'email': email
        }
        }),201
    
    return jsonify({'message': 'Dados inválidos'}), 400