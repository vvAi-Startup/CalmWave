from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from flask_cors import CORS
from auth import auth_bp
from audio_processor import AudioProcessor
import os
import uuid
import logging
import time

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
# Configurar CORS para aceitar requisições de qualquer origem
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.register_blueprint(auth_bp, url_prefix='/auth')

# Inicializar processador de áudio
audio_processor = AudioProcessor()

# Armazenar sessões ativas
active_sessions = {}

@app.route('/health')
def health_check():
    """Endpoint para verificar se a API está online"""
    return jsonify({'status': 'ok'}), 200

@app.route('/')
def index():
    """Rota principal que serve a página de upload de áudio"""
    return render_template('audio_upload.html')

@app.route('/upload', methods=['POST'])
def upload_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "Nenhum arquivo de áudio enviado"}), 400

        audio_file = request.files['audio']
        if not audio_file:
            return jsonify({"error": "Arquivo de áudio vazio"}), 400

        # Obter ou criar session_id
        session_id = request.form.get('session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
            active_sessions[session_id] = {"chunks": 0}
            logger.info(f"Nova sessão criada: {session_id}")

        # Obter número do chunk
        chunk_number = active_sessions[session_id]["chunks"]
        active_sessions[session_id]["chunks"] += 1

        # Ler dados do áudio
        audio_data = audio_file.read()
        if not audio_data:
            return jsonify({"error": "Dados de áudio vazios"}), 400

        # Obter informações do arquivo
        content_type = audio_file.content_type
        filename = audio_file.filename
        logger.info(f"Upload recebido - Content-Type: {content_type}, Filename: {filename}")

        # Salvar chunk
        result = audio_processor.save_audio_chunk(
            audio_data, 
            session_id, 
            chunk_number,
            content_type=content_type,
            filename=filename
        )
        logger.info(f"Chunk {chunk_number} salvo com sucesso na sessão {session_id}")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Erro no upload: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

@app.route('/upload_mp3', methods=['POST'])
def upload_mp3():
    try:
        logger.info("Recebendo upload de MP3...")
        
        if 'file' not in request.files:
            logger.error("Nenhum arquivo MP3 encontrado na requisição")
            return jsonify({'error': 'Nenhum arquivo MP3 encontrado'}), 400

        file = request.files['file']
        if file.filename == '':
            logger.error("Arquivo MP3 vazio")
            return jsonify({'error': 'Arquivo MP3 vazio'}), 400

        if not file.filename.endswith('.mp3'):
            logger.error("Arquivo não é MP3")
            return jsonify({'error': 'Arquivo deve ser MP3'}), 400

        # Gerar session_id
        session_id = str(uuid.uuid4())
        logger.info(f"Nova sessão MP3 criada: {session_id}")

        # Processar MP3
        audio_data = file.read()
        if not audio_data:
            logger.error("Dados do MP3 vazios")
            return jsonify({'error': 'Dados do MP3 vazios'}), 400

        chunk_path = audio_processor.save_audio_chunk(audio_data, session_id, 0)
        logger.info(f"MP3 processado com sucesso: {chunk_path}")

        # Processar sessão
        wav_path = audio_processor.process_session(session_id)
        logger.info(f"MP3 convertido para WAV: {wav_path}")

        # Retornar caminho relativo para o arquivo processado
        relative_path = os.path.relpath(wav_path, os.getcwd())
        return jsonify({
            'message': 'MP3 processado com sucesso',
            'session_id': session_id,
            'wav_path': f'/processed/{os.path.basename(wav_path)}'
        })

    except Exception as e:
        logger.error(f"Erro no upload do MP3: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/process/<session_id>', methods=['POST'])
def process_audio(session_id):
    try:
        if session_id not in active_sessions:
            return jsonify({
                "status": "error",
                "message": "Sessão não encontrada",
                "session_id": session_id
            }), 404

        # Processar áudio
        result = audio_processor.process_session(session_id)
        
        if result["status"] == "error":
            return jsonify(result), 500

        # Limpar sessão após processamento
        if session_id in active_sessions:
            del active_sessions[session_id]

        return jsonify(result)

    except Exception as e:
        logger.error(f"Erro no processamento: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Erro ao processar áudio: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/status/<session_id>', methods=['GET'])
def get_status(session_id):
    try:
        result = audio_processor.get_session_status(session_id)
        
        if result["status"] == "not_found":
            return jsonify(result), 404
        elif result["status"] == "error":
            return jsonify(result), 500

        return jsonify(result)

    except Exception as e:
        logger.error(f"Erro ao verificar status: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Erro ao verificar status: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/audio/<session_id>', methods=['GET'])
def get_audio(session_id):
    try:
        processed_file = os.path.join(audio_processor.processed_folder, f'processed_{session_id}.wav')
        if not os.path.exists(processed_file):
            return jsonify({
                "status": "error",
                "message": "Arquivo de áudio não encontrado",
                "session_id": session_id
            }), 404

        return send_file(processed_file, mimetype='audio/wav')

    except Exception as e:
        logger.error(f"Erro ao recuperar áudio: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Erro ao recuperar áudio: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/processed/<filename>')
def serve_processed_file(filename):
    """Serve arquivos processados da pasta processed"""
    try:
        logger.info(f"Servindo arquivo processado: {filename}")
        return send_from_directory('processed', filename)
    except Exception as e:
        logger.error(f"Erro ao servir arquivo {filename}: {str(e)}")
        return jsonify({'error': 'Arquivo não encontrado'}), 404

@app.route('/stream/<session_id>', methods=['GET'])
def stream_audio(session_id):
    try:
        logger.info(f"Streaming áudio da sessão: {session_id}")
        chunks = audio_processor.get_session_chunks(session_id)
        if not chunks:
            logger.error(f"Nenhum chunk encontrado para a sessão: {session_id}")
            return jsonify({'error': 'Nenhum chunk encontrado'}), 404

        # Retornar lista de chunks para streaming
        return jsonify({
            'chunks': chunks,
            'total_chunks': len(chunks)
        })
    except Exception as e:
        logger.error(f"Erro ao streamar áudio da sessão {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/chunk/<session_id>/<int:chunk_number>', methods=['GET'])
def get_chunk(session_id, chunk_number):
    try:
        logger.info(f"Obtendo chunk {chunk_number} da sessão {session_id}")
        chunks = audio_processor.get_session_chunks(session_id)
        if not chunks or chunk_number >= len(chunks):
            logger.error(f"Chunk {chunk_number} não encontrado na sessão {session_id}")
            return jsonify({'error': 'Chunk não encontrado'}), 404

        return send_file(chunks[chunk_number], mimetype='audio/wav')
    except Exception as e:
        logger.error(f"Erro ao obter chunk {chunk_number} da sessão {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/cleanup/<session_id>', methods=['POST'])
def cleanup(session_id):
    try:
        logger.info(f"Iniciando limpeza da sessão: {session_id}")
        audio_processor.cleanup(session_id)
        logger.info(f"Limpeza concluída para a sessão: {session_id}")
        return jsonify({'message': 'Limpeza concluída com sucesso'})
    except Exception as e:
        logger.error(f"Erro na limpeza da sessão {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 