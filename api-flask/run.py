from app import create_app
import logging
import os

app = create_app()

if __name__ == '__main__':
    log_level = getattr(logging, app.config['LOG_LEVEL'])
    logging.getLogger().setLevel(log_level)
    logging.info(f"Iniciando a aplicação Flask com nível de log: {app.config['LOG_LEVEL']}")
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_DEBUG') == '1')