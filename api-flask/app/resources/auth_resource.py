from flask import Blueprint, request, jsonify, current_app
from functools import wraps
from app.services.auth_service import AuthService
from app.schemas.user_schema import UserRegistrationSchema, UserLoginSchema, TokenSchema
from app.extensions import logger

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Declarar as instâncias dos serviços globalmente, mas elas serão preenchidas
# no app/__init__.py APÓS a inicialização do DB.
# auth_service = None # REMOVA ESTA LINHA

# A função register_auth_resources será removida.

def token_required(f):
    """
    Decorator para proteger rotas que requerem autenticação.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token_header = request.headers.get('Authorization')
        
        # Acessa o serviço de autenticação da instância do Flask app
        auth_service = current_app.auth_service
        user, error_message = auth_service.get_user_from_token(token_header)

        if error_message:
            logger.warning(f"Falha na autenticação: {error_message}")
            return jsonify({'message': error_message}), 401
        
        # Passa o objeto user para a função decorada
        return f(user=user, *args, **kwargs)
    return decorated

@auth_bp.route('/login', methods=['POST'])
def login():
    """
    Endpoint para login de usuário.
    Recebe credenciais e retorna um token JWT se válidas.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Requisição sem dados JSON'}), 400

    # Acessa o serviço de autenticação da instância do Flask app
    auth_service = current_app.auth_service
    response, status_code = auth_service.login_user(data)
    return jsonify(response), status_code

@auth_bp.route('/register', methods=['POST'])
def register():
    """
    Endpoint para registro de novos usuários.
    Recebe dados do usuário e retorna um token JWT.
    """
    data = request.get_json()
    if not data:
        return jsonify({'message': 'Requisição sem dados JSON'}), 400

    # Acessa o serviço de autenticação da instância do Flask app
    auth_service = current_app.auth_service
    response, status_code = auth_service.register_user(data)
    return jsonify(response), status_code
