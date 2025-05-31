from flask import Blueprint, request, jsonify
from functools import wraps
from app.services.auth_service import AuthService
from app.schemas.user_schema import UserRegistrationSchema, UserLoginSchema, TokenSchema
from app.extensions import logger

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

# Instância do serviço de autenticação
auth_service = None # Será inicializado em register_auth_resources

def register_auth_resources(app):
    global auth_service
    with app.app_context():
        auth_service = AuthService()

    def token_required(f):
        """
        Decorator to protect routes that require authentication.
        """
        @wraps(f)
        def decorated(*args, **kwargs):
            token_header = request.headers.get('Authorization')
            
            user, error_message = auth_service.get_user_from_token(token_header)

            if error_message:
                logger.warning(f"Authentication failed: {error_message}")
                return jsonify({'message': error_message}), 401
            
            # Pass the user object to the decorated function
            return f(user=user, *args, **kwargs)
        return decorated

    # Adicione o decorator token_required ao blueprint para que outras rotas possam usá-lo
    # Exemplo: @auth_bp.route('/protected_route') @token_required def protected_route(user): ...

    @auth_bp.route('/login', methods=['POST'])
    def login():
        """
        Endpoint for user login.
        Receives credentials and returns a JWT token if valid.
        """
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Requisição sem dados JSON'}), 400

        response, status_code = auth_service.login_user(data)
        return jsonify(response), status_code

    @auth_bp.route('/register', methods=['POST'])
    def register():
        """
        Endpoint for new user registration.
        Receives user data and returns a JWT token.
        """
        data = request.get_json()
        if not data:
            return jsonify({'message': 'Requisição sem dados JSON'}), 400

        response, status_code = auth_service.register_user(data)
        return jsonify(response), status_code

    # Exemplo de rota protegida (descomente para usar)
    # @auth_bp.route('/me', methods=['GET'])
    # @token_required
    # def get_current_user(user):
    #     """
    #     Endpoint to get current authenticated user's details.
    #     Requires a valid JWT token.
    #     """
    #     return jsonify({
    #         'status': 'success',
    #         'message': 'Dados do usuário autenticado',
    #         'user': {
    #             'id': user['_id'],
    #             'name': user['name'],
    #             'email': user['email']
    #         }
    #     }), 200