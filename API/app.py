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

# Carregar variáveis de ambiente do .env
load_dotenv()

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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

# Armazenar sessões ativas (em memória, para controle básico)
active_sessions = {}

# Conectar ao MongoDB
try:
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        raise ValueError("Variável de ambiente 'MONGO_URI' não definida.")
    mongo = MongoClient(mongo_uri)
    db = mongo['calmwave']
    chunks_collection = db['chunks']
    logger.info("Conectado ao MongoDB com sucesso.")
except Exception as e:
    logger.error(f"Erro ao conectar ao MongoDB: {str(e)}", exc_info=True)
    # Em um ambiente de produção, você pode querer sair ou ter um fallback
    # Para desenvolvimento, vamos apenas logar o erro.

def get_user_id_from_request():
    """
    Extrai o user_id do token JWT na requisição.
    """
    token = request.headers.get('Authorization')
    if not token:
        logger.debug("Nenhum token de autorização encontrado.")
        return None
    if token.startswith('Bearer '):
        token = token[7:]
    payload = verify_token(token)
    if not payload:
        logger.warning("Token JWT inválido ou expirado.")
        return None
    return payload.get('user_id')

@app.route('/health')
def health_check():
    """
    Endpoint para verificar se a API está online.
    """
    return jsonify({'status': 'ok', 'message': 'API está funcionando!'}), 200

@app.route('/upload', methods=['POST'])
def upload_audio():
    """
    Endpoint para upload de chunks de áudio.
    Recebe um chunk de áudio e o associa a uma sessão existente ou cria uma nova.
    O áudio é salvo temporariamente.
    """
    try:
        # Obter user_id do token JWT e autenticar
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning("Tentativa de upload sem autenticação ou token inválido.")
            return jsonify({'error': 'Usuário não autenticado ou token inválido'}), 401

        if 'audio' not in request.files:
            logger.error("Nenhum arquivo de áudio enviado na requisição.")
            return jsonify({"error": "Nenhum arquivo de áudio enviado"}), 400

        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            logger.error("Arquivo de áudio vazio ou sem nome.")
            return jsonify({"error": "Arquivo de áudio vazio"}), 400

        # Obter session_id do formulário
        session_id = request.form.get('session_id')
        logger.info(f"Upload recebido para session_id: {session_id}")
        
        # Se não tiver session_id, criar nova sessão
        if not session_id:
            session_id = str(uuid.uuid4())
            active_sessions[session_id] = {"chunks": 0}
            logger.info(f"Nova sessão criada: {session_id}")
        # Se tiver session_id mas não estiver em active_sessions, inicializar
        elif session_id not in active_sessions:
            active_sessions[session_id] = {"chunks": 0}
            logger.info(f"Sessão existente inicializada: {session_id}")

        # Obter número do chunk
        chunk_number = active_sessions[session_id]["chunks"]
        active_sessions[session_id]["chunks"] += 1

        # Ler dados do áudio
        audio_data = audio_file.read()
        if not audio_data:
            logger.error("Dados de áudio vazios após leitura do arquivo.")
            return jsonify({"error": "Dados de áudio vazios"}), 400

        # Obter informações do arquivo
        content_type = audio_file.content_type
        filename = audio_file.filename
        logger.info(f"Upload recebido - Session: {session_id}, Chunk: {chunk_number}, Content-Type: {content_type}, Filename: {filename}")

        # Salvar chunk
        saved_path = audio_processor.save_audio_chunk(
            audio_data, 
            session_id, 
            chunk_number,
            content_type=content_type,
            filename=filename
        )
        logger.info(f"Chunk {chunk_number} salvo com sucesso na sessão {session_id} em: {saved_path}")

        # Salvar informações no MongoDB
        try:
            chunks_collection.insert_one({
                "session_id": session_id,
                "user_id": user_id,
                "chunk_number": chunk_number,
                "filename": filename,
                "content_type": content_type,
                "saved_path": saved_path,
                "created_at": time.time()
            })
            logger.info(f"Informações do chunk {chunk_number} da sessão {session_id} salvas no MongoDB.")
        except Exception as mongo_err:
            logger.error(f"Erro ao salvar informações do chunk no MongoDB: {str(mongo_err)}", exc_info=True)
            # Não retornar erro 500 para o cliente se o upload do arquivo foi bem-sucedido, mas o MongoDB falhou.
            # Apenas logar o erro.

        response_data = {
            "chunk_number": chunk_number,
            "session_id": session_id,
            "message": "Chunk processado com sucesso"
        }
        logger.info(f"Resposta do upload: {response_data}")
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Erro inesperado no endpoint /upload: {str(e)}", exc_info=True)
        return jsonify({"error": f"Erro interno do servidor: {str(e)}"}), 500

@app.route('/process/<session_id>', methods=['POST'])
def process_audio(session_id):
    """
    Endpoint para processar todos os chunks de uma sessão.
    Combina os chunks M4A e converte para WAV.
    """
    try:
        # Autenticação
        user_id = get_user_id_from_request()
        if not user_id:
            logger.warning(f"Tentativa de processar sessão {session_id} sem autenticação ou token inválido.")
            return jsonify({'error': 'Usuário não autenticado ou token inválido'}), 401

        if session_id not in active_sessions:
            logger.warning(f"Sessão {session_id} não encontrada para processamento.")
            return jsonify({
                "status": "error",
                "message": "Sessão não encontrada para processamento",
                "session_id": session_id
            }), 404

        logger.info(f"Iniciando processamento da sessão: {session_id}")
        result = audio_processor.process_session(session_id)
        
        if result["status"] == "error":
            logger.error(f"Erro no processamento da sessão {session_id}: {result['message']}")
            return jsonify(result), 500

        logger.info(f"Sessão {session_id} processada com sucesso. Output: {result.get('output_path')}")

        # Limpar recursos da sessão após o processamento bem-sucedido
        try:
            audio_processor.cleanup(session_id)
            logger.info(f"Recursos da sessão {session_id} limpos após processamento.")
        except Exception as cleanup_err:
            logger.error(f"Erro ao limpar recursos da sessão {session_id}: {str(cleanup_err)}", exc_info=True)
            # A limpeza falhou, mas o processamento foi bem-sucedido, então não retornamos erro 500 ao cliente.
            # Apenas logamos o problema.

        # Remover sessão da lista de sessões ativas (em memória)
        if session_id in active_sessions:
            del active_sessions[session_id]
            logger.info(f"Sessão {session_id} removida de active_sessions.")

        return jsonify(result), 200

    except Exception as e:
        logger.error(f"Erro inesperado no endpoint /process/{session_id}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Erro interno do servidor ao processar áudio: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/audio/<session_id>', methods=['GET'])
def get_audio(session_id):
    """
    Endpoint para recuperar o áudio processado de uma sessão.
    Serve o arquivo WAV final.
    """
    try:
        # O AudioProcessor salva o arquivo final como 'final_processed_{session_id}.wav'
        # Precisamos garantir que o caminho do arquivo seja construído corretamente.
        # Idealmente, o output_path estaria armazenado no MongoDB após o processamento.
        # Por simplicidade, vamos reconstruir o nome do arquivo aqui.
        filename = f'final_processed_{session_id}.wav'
        processed_file_path = os.path.join(audio_processor.processed_folder, filename)

        if not os.path.exists(processed_file_path):
            logger.warning(f"Arquivo de áudio processado não encontrado para a sessão {session_id} em {processed_file_path}")
            return jsonify({
                "status": "error",
                "message": "Arquivo de áudio não encontrado ou ainda não processado",
                "session_id": session_id
            }), 404

        logger.info(f"Servindo arquivo processado: {processed_file_path}")
        return send_file(processed_file_path, mimetype='audio/wav')

    except Exception as e:
        logger.error(f"Erro ao recuperar áudio para sessão {session_id}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Erro ao recuperar áudio: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/processed/<filename>')
def serve_processed_file(filename):
    """
    Endpoint para servir arquivos processados diretamente pelo nome do arquivo.
    Útil se o cliente já souber o nome do arquivo final (ex: final_processed_SESSIONID.wav).
    """
    try:
        logger.info(f"Servindo arquivo processado: {filename} do diretório {audio_processor.processed_folder}")
        return send_from_directory(audio_processor.processed_folder, filename)
    except Exception as e:
        logger.error(f"Erro ao servir arquivo {filename}: {str(e)}", exc_info=True)
        return jsonify({'error': 'Arquivo não encontrado ou erro interno'}), 404

@app.route('/stream/<session_id>', methods=['GET'])
def stream_audio(session_id):
    """
    Endpoint para streaming de áudio.
    Retorna uma lista de chunks disponíveis para streaming.
    (Nota: Este endpoint pode precisar de mais lógica se o streaming real for implementado
    com chunks individuais em vez de um arquivo final combinado.)
    """
    try:
        logger.info(f"Solicitação de streaming de áudio para sessão: {session_id}")
        # Para streaming de chunks individuais, você precisaria de um endpoint para servir
        # cada chunk separadamente, e o cliente faria múltiplas requisições.
        # No contexto atual, que combina todos os chunks, este endpoint pode ser menos relevante
        # a menos que você queira expor os chunks M4A originais antes da combinação.
        
        # Por enquanto, vamos retornar os caminhos dos chunks M4A originais
        chunks_m4a_paths = audio_processor.get_session_chunks(session_id)
        
        if not chunks_m4a_paths:
            logger.warning(f"Nenhum chunk M4A encontrado para a sessão: {session_id}")
            return jsonify({'error': 'Nenhum chunk encontrado para streaming'}), 404

        # Retornar apenas os nomes dos arquivos ou URLs relativas, não os caminhos completos do servidor
        # Exemplo: /uploads/session_id/chunk_0.m4a
        base_url = request.url_root.replace('http://', 'https://') # Ajustar para HTTPS se necessário
        streamable_urls = [
            f"{base_url}uploads/{session_id}/{os.path.basename(p)}" 
            for p in chunks_m4a_paths
        ]
        
        logger.info(f"Retornando {len(streamable_urls)} chunks para streaming da sessão {session_id}.")
        return jsonify({
            'chunks': streamable_urls,
            'total_chunks': len(streamable_urls),
            'message': 'URLs de chunks M4A originais para streaming (se aplicável).'
        }), 200
    except Exception as e:
        logger.error(f"Erro ao streamar áudio da sessão {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': f"Erro interno do servidor ao streamar áudio: {str(e)}"}), 500

# Endpoint para servir chunks M4A individuais (para o endpoint /stream)
@app.route('/uploads/<session_id>/<filename>', methods=['GET'])
def serve_uploaded_chunk(session_id, filename):
    """
    Endpoint para servir um chunk M4A individual de uma sessão específica.
    """
    try:
        file_path = os.path.join(audio_processor.upload_folder, session_id, filename)
        if not os.path.exists(file_path):
            logger.warning(f"Chunk M4A não encontrado: {file_path}")
            return jsonify({'error': 'Chunk de áudio não encontrado'}), 404
        
        logger.info(f"Servindo chunk M4A: {file_path}")
        return send_file(file_path, mimetype='audio/m4a')
    except Exception as e:
        logger.error(f"Erro ao servir chunk M4A {filename} da sessão {session_id}: {str(e)}", exc_info=True)
        return jsonify({'error': 'Erro ao recuperar chunk de áudio'}), 500


if __name__ == '__main__':
    # Em um ambiente de produção, use um servidor WSGI como Gunicorn ou uWSGI.
    # debug=True é apenas para desenvolvimento.
    app.run(host='0.0.0.0', port=5000, debug=True)
