from flask import Blueprint, request, jsonify
from functools import wraps
import jwt
from datetime import datetime, timedelta

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
    
    # Aqui você implementaria a verificação real das credenciais
    # Este é apenas um exemplo
    if data.get('username') == 'admin' and data.get('password') == 'admin':
        token = generate_token(1)  # ID do usuário
        return jsonify({
            'token': token,
            'user': {
                'id': 1,
                'username': 'admin'
            }
        })
    
    return jsonify({'message': 'Credenciais inválidas'}), 401

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint para registro de novos usuários.
    
    Recebe dados do usuário e retorna um token JWT.
    
    Returns:
        JSON: Token JWT e informações do usuário
    """
    data = request.get_json()
    
    # Aqui você implementaria o registro real do usuário
    # Este é apenas um exemplo
    if data.get('username') and data.get('password'):
        # Simular criação de usuário
        user_id = 1  # ID do novo usuário
        token = generate_token(user_id)
        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'username': data.get('username')
            }
        })
    
    return jsonify({'message': 'Dados inválidos'}), 400