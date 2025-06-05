from app import create_app
from app.config import Config
from app.extensions import logger

app = create_app(Config)

if __name__ == '__main__':
    try:
        logger.info(f"Iniciando servidor na porta {app.config.get('PORT', 5000)}")
        app.run(
            host='0.0.0.0',
            port=int(app.config.get('PORT', 5000)),
            debug=app.config.get('DEBUG', False)
        )
    except Exception as e:
        logger.error(f"Erro ao iniciar o servidor: {str(e)}")
        raise