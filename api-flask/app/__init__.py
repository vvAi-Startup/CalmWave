from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import sys
import os

from app.config import Config
from app.extensions import init_extensions, logger, db

from app.resources.audio_resource import audio_bp
from app.resources.auth_resource import auth_bp
from app.services import AudioService, AuthService
from app.resources import register_resources


def create_app(config_object=None):
    """Cria e configura a aplicação Flask."""
    app = Flask(__name__)

    # Carrega a configuração
    if config_object:
        app.config.from_object(config_object)
    else:
        app.config.from_object('app.config.Config')

    # Inicializa as extensões
    db_instance = init_extensions(app)

    logging.basicConfig(
        level=getattr(logging, app.config['LOG_LEVEL']),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )

    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    app.config['JSON_AS_ASCII'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

    @app.errorhandler(404)
    def not_found_error(error):
        return {'status': 'error', 'message': 'Recurso não encontrado'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        logger.error(f"Erro interno do servidor: {str(error)}")
        return {'status': 'error', 'message': 'Erro interno do servidor'}, 500

    @app.errorhandler(Exception)
    def handle_exception(error):
        logger.error(f"Erro não tratado: {str(error)}")
        return {'status': 'error', 'message': str(error)}, 500

    @app.after_request
    def after_request(response):
        response.headers.add('Content-Type', 'application/json; charset=utf-8')
        response.headers.add('X-Content-Type-Options', 'nosniff')
        response.headers.add('X-Frame-Options', 'DENY')
        return response

    with app.app_context():
        # Inicializa os serviços
        app.audio_service = AudioService(db_instance)
        app.auth_service = AuthService(db_instance)

        # Cria diretórios necessários
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)
        os.makedirs(app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), exist_ok=True)

        # Registra os recursos
        register_resources(app)

    # Log de inicialização
    logger.info("Aplicação Flask inicializada com sucesso")
    logger.info(f"Ambiente: {app.config['FLASK_ENV']}")
    logger.info(f"Debug: {app.config.get('DEBUG', False)}")
    logger.info(f"Porta: {app.config.get('PORT', 5000)}")

    return app
