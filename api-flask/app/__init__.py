from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import sys
import os

from app.config import Config
from app.extensions import init_mongo, logger
from app.resources.audio_resource import audio_bp, register_resources as register_audio_resources
from app.resources.auth_resource import auth_bp, register_auth_resources # Importe o blueprint e a função de registro
from app.audio_processor import AudioProcessor # Certifique-se de que este é o seu arquivo atualizado

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Configuração de logging
    logging.basicConfig(
        level=getattr(logging, app.config['LOG_LEVEL']),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(sys.stdout)
        ]
    )

    # Configura CORS
    CORS(app, resources={
        r"/*": {
            "origins": "*",
            "methods": ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Configuração do Flask para melhor tratamento de erros
    app.config['JSON_AS_ASCII'] = False
    app.config['JSONIFY_PRETTYPRINT_REGULAR'] = True
    app.config['JSONIFY_MIMETYPE'] = 'application/json; charset=utf-8'

    @app.errorhandler(Exception)
    def handle_error(error):
        """Handler global para erros não tratados"""
        logger.error(f"Erro não tratado: {str(error)}", exc_info=True)
        response = {
            "status": "error",
            "message": "Erro interno do servidor",
            "error": str(error)
        }
        return jsonify(response), 500

    @app.after_request
    def after_request(response):
        """Adiciona headers de segurança e encoding"""
        response.headers.add('Content-Type', 'application/json; charset=utf-8')
        response.headers.add('X-Content-Type-Options', 'nosniff')
        response.headers.add('X-Frame-Options', 'DENY')
        return response

    with app.app_context():
        # Inicializa o MongoDB (incluindo users_collection)
        init_mongo(app)
        
        # Define a BASE_URL que será usada pelo service para construir URLs de download
        # Note: request.url_root só está disponível dentro de um contexto de requisição.
        # Para um valor inicial, você pode usar uma URL padrão ou definir de outra forma.
        # Para este exemplo, vamos assumir que está ok para o momento da inicialização.
        # Em produção, você pode querer definir isso via variável de ambiente ou outra configuração.
        app.config['BASE_URL'] = os.getenv('BASE_URL', 'http://127.0.0.1:5000') # Default fallback

        # Crie os diretórios de áudio se não existirem
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)

        # Registra os recursos (endpoints) de áudio
        register_audio_resources(app)
        app.register_blueprint(audio_bp)

        # Registra os recursos (endpoints) de autenticação
        register_auth_resources(app) # Chama a função para inicializar e registrar o blueprint
        app.register_blueprint(auth_bp) # Registra o blueprint de autenticação

    return app