# app/resources/__init__.py

# Importe apenas os Blueprints, as funções de registro foram removidas
from .audio_resource import audio_bp
from .auth_resource import auth_bp

def register_resources(app):
    """Registra todos os blueprints da aplicação."""
    app.register_blueprint(audio_bp)
    app.register_blueprint(auth_bp)
