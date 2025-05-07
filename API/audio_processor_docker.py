from flask import Flask, request, jsonify
import os
from pydub import AudioSegment
import tempfile
import uuid
from datetime import datetime

app = Flask(__name__)

# Configurações
UPLOAD_FOLDER = '/app/uploads'
PROCESSED_FOLDER = '/app/processed'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(PROCESSED_FOLDER, exist_ok=True)

@app.route('/process', methods=['POST'])
def process_audio():
    try:
        # Verificar se o arquivo foi enviado
        if 'audio' not in request.files:
            return jsonify({'error': 'Nenhum arquivo de áudio enviado'}), 400

        audio_file = request.files['audio']
        if not audio_file:
            return jsonify({'error': 'Arquivo de áudio vazio'}), 400

        # Obter metadados
        session_id = request.form.get('session_id')
        chunk_number = request.form.get('chunk_number')
        timestamp = request.form.get('timestamp')

        if not all([session_id, chunk_number]):
            return jsonify({'error': 'Metadados incompletos'}), 400

        # Criar diretório da sessão
        session_dir = os.path.join(UPLOAD_FOLDER, session_id)
        os.makedirs(session_dir, exist_ok=True)

        # Salvar arquivo
        temp_path = os.path.join(session_dir, f'chunk_{chunk_number}.wav')
        audio_file.save(temp_path)

        # Processar áudio (aqui você pode adicionar seu processamento específico)
        audio = AudioSegment.from_wav(temp_path)
        
        # Exemplo de processamento: normalizar volume
        processed_audio = audio.normalize()
        
        # Salvar áudio processado
        processed_path = os.path.join(PROCESSED_FOLDER, f'{session_id}_chunk_{chunk_number}.wav')
        processed_audio.export(processed_path, format='wav')

        return jsonify({
            'message': 'Áudio processado com sucesso',
            'session_id': session_id,
            'chunk_number': chunk_number,
            'processed_path': processed_path
        }), 200

    except Exception as e:
        print(f"Erro ao processar áudio: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Endpoint para verificar se o serviço está funcionando"""
    return jsonify({'status': 'healthy'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001) 