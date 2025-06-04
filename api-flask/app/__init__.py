from flask import Flask, jsonify, request
from flask_cors import CORS
import logging
import sys
import os

from app.config import Config
# Import the extensions module to access its attributes after initialization
import app.extensions as extensions_module # Alias to avoid conflict with app.extensions dict

from app.resources.audio_resource import audio_bp
from app.resources.auth_resource import auth_bp
from app.services.audio_service import AudioService
from app.services.auth_service import AuthService


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    logging.basicConfig(
        level=getattr(logging, app.config['LOG_LEVEL']),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )
    # The app.logger is Flask's default logger, configured by basicConfig.
    # If you need the logger from app.extensions specifically, use app.extensions.logger.

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

    @app.errorhandler(Exception)
    def handle_error(error):
        # Use Flask's app logger or app.extensions.logger
        app.logger.error(f"Erro não tratado: {str(error)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Erro interno do servidor",
            "error": str(error)
        }), 500

    @app.after_request
    def after_request(response):
        response.headers.add('Content-Type', 'application/json; charset=utf-8')
        response.headers.add('X-Content-Type-Options', 'nosniff')
        response.headers.add('X-Frame-Options', 'DENY')
        return response

    with app.app_context():
        extensions_module.init_mongo(app)  # Call init_mongo from the aliased module

        # Services are initialized with the db instance from the extensions module,
        # which is now guaranteed to be set up by init_mongo.
        app.audio_service = AudioService(extensions_module.db)
        app.auth_service = AuthService(extensions_module.db)


        #app.config['BASE_URL'] = os.getenv('BASE_URL', 'http://127.0.0.1:5000')

        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(app.config['PROCESSED_FOLDER'], exist_ok=True)
        os.makedirs(app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), exist_ok=True)

        app.register_blueprint(audio_bp)
        app.register_blueprint(auth_bp)

    return app
