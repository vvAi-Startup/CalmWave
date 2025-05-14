from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from flask_cors import CORS
from auth import auth_bp, verify_token
from audio_processor import AudioProcessor
from dotenv import load_dotenv
import os
import uuid
import logging
import time
from pymongo import MongoClient


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


# Conectar ao MongoDB
mongo = MongoClient(os.getenv('MONGO_URI'))
db = mongo['calmwave']
chunks_collection = db['chunks']


def get_user_id_from_request():
    token = request.headers.get('Authorization')
    if not token:
        return None
    if token.startswith('Bearer '):
        token = token[7:]
    payload = verify_token(token)
    if not payload:
        return None
    return payload.get('user_id')


@app.route('/health')
def health_check():
    """
    Endpoint para verificar se a API está online.
    
    Returns:
        JSON: Status da API
    """
    return jsonify({'status': 'ok'}), 200


@app.route('/upload', methods=['POST'])
def upload_audio():
    """
    Endpoint para upload de chunks de áudio.
    
    Recebe um chunk de áudio e o associa a uma sessão existente ou cria uma nova.
    O áudio é salvo temporariamente e processado posteriormente.
    
    Returns:
        JSON: Informações sobre o chunk processado
    """
    try:
        # Obter user_id do token JWT e autenticar
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning("Tentativa de upload sem autenticação ou token inválido.")
            return jsonify({'error': 'Usuário não autenticado ou token inválido'}), 401

        if 'audio' not in request.files:
            return jsonify({"error": "Nenhum arquivo de áudio enviado"}), 400

        audio_file = request.files['audio']
        if not audio_file:
            return jsonify({"error": "Arquivo de áudio vazio"}), 400

        # Obter session_id do formulário
        session_id = request.form.get('session_id')
        logger.info(f"Session ID recebido: {session_id}")
        
        # Se não tiver session_id, criar nova sessão
        if not session_id:
            session_id = str(uuid.uuid4())
            active_sessions[session_id] = {"chunks": 0}
            logger.info(f"Nova sessão criada: {session_id}")
        # Se tiver session_id mas não estiver em active_sessions, inicializar
        elif session_id not in active_sessions:
            active_sessions[session_id] = {"chunks": 0}
            logger.info(f"Sessão inicializada: {session_id}")

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

        # Salvar informações no MongoDB
        chunks_collection.insert_one({
            "session_id": session_id,
            "user_id": user_id,
            "chunk_number": chunk_number,
            "filename": filename,
            "content_type": content_type,
            "saved_path": result,
            "created_at": time.time()
        })

        # Garantir que o session_id retornado seja o mesmo que foi recebido/criado
        response_data = {
            "chunk_number": chunk_number,
            "session_id": session_id,
            "message": "Chunk processado com sucesso"
        }
        logger.info(f"Resposta do upload: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        logger.error(f"Erro no upload: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/process/<session_id>', methods=['POST'])
def process_audio(session_id):
    """
    Endpoint para processar todos os chunks de uma sessão.
    
    Args:
        session_id: ID da sessão a ser processada
        
    Returns:
        JSON: Resultado do processamento
    """
    try:
        # Autenticação
        user_id = get_user_id_from_request() # user_id can be used for further checks if needed
        if not user_id:
            logger.warning(f"Tentativa de processar sessão {session_id} sem autenticação ou token inválido.")
            return jsonify({'error': 'Usuário não autenticado ou token inválido'}), 401

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


@app.route('/audio/<session_id>', methods=['GET'])
def get_audio(session_id):
    """
    Endpoint para recuperar o áudio processado de uma sessão.
    
    Args:
        session_id: ID da sessão
        
    Returns:
        File: Arquivo de áudio processado
    """
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
    """
    Endpoint para servir arquivos processados.
    
    Args:
        filename: Nome do arquivo processado
        
    Returns:
        File: Arquivo processado
    """
    try:
        logger.info(f"Servindo arquivo processado: {filename}")
        return send_from_directory('processed', filename)
    except Exception as e:
        logger.error(f"Erro ao servir arquivo {filename}: {str(e)}")
        return jsonify({'error': 'Arquivo não encontrado'}), 404


@app.route('/stream/<session_id>', methods=['GET'])
def stream_audio(session_id):
    """
    Endpoint para streaming de áudio.
    
    Args:
        session_id: ID da sessão
        
    Returns:
        JSON: Lista de chunks disponíveis para streaming
    """
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


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
