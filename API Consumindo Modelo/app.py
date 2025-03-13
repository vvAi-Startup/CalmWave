#app.py
from flask import Flask, send_from_directory
from config.db import initialize_db 
from routes.ia_data_routes import ia_data_blue_print
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Configurar diretórios para arquivos estáticos
UPLOAD_FOLDER = os.path.abspath('uploads')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Criar diretórios necessários
os.makedirs(os.path.join(UPLOAD_FOLDER, 'spectrograms'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'waveforms'), exist_ok=True)
os.makedirs(os.path.join(UPLOAD_FOLDER, 'audios'), exist_ok=True)

CORS(app)

initialize_db()

app.register_blueprint(ia_data_blue_print, url_prefix='/ia')

@app.route('/')
def index():
    return "Bem vindo ao Flask"

@app.route('/uploads/<path:filename>')
def serve_file(filename):
    try:
        # Determinar o subdiretório correto baseado no tipo de arquivo
        if filename.startswith('spectrograms/'):
            subdir = 'spectrograms'
        elif filename.startswith('waveforms/'):
            subdir = 'waveforms'
        elif filename.startswith('audios/'):
            subdir = 'audios'
        else:
            subdir = ''
        
        # Remover o prefixo do subdiretório do filename se existir
        if '/' in filename:
            _, filename = filename.split('/', 1)
        
        return send_from_directory(
            os.path.join(app.config['UPLOAD_FOLDER'], subdir),
            filename,
            as_attachment=False
        )
    except Exception as e:
        print(f"Erro ao servir arquivo: {e}")
        return f"Erro ao acessar arquivo: {str(e)}", 404

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)