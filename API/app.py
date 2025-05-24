from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from flask_cors import CORS
import shutil
from auth import auth_bp, verify_token # Assuming auth.py contains auth_bp and verify_token
from audio_processor import AudioProcessor # Ensure AudioProcessor is the updated version
from dotenv import load_dotenv
import os
import uuid
import logging
import time
from pymongo import MongoClient
from bson.objectid import ObjectId # Import ObjectId for MongoDB queries
import requests # Importar a biblioteca requests

# Carrega variáveis de ambiente do arquivo .env
load_dotenv()

# Configuração de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configura CORS para aceitar requisições de qualquer origem
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "DELETE", "OPTIONS", "PUT"], # Adicionado método PUT para mais flexibilidade
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

app.register_blueprint(auth_bp, url_prefix='/auth')

# Inicializa o processador de áudio
audio_processor = AudioProcessor()

# Conecta ao MongoDB
try:
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        raise ValueError("Variável de ambiente 'MONGO_URI' não está definida.")
    mongo = MongoClient(mongo_uri)
    db = mongo['calmwave']
    final_audios_collection = db['final_audios'] # Coleção para armazenar metadados dos áudios
    logger.info("Conectado ao MongoDB com sucesso.")
except Exception as e:
    logger.error(f"Erro ao conectar ao MongoDB: {str(e)}", exc_info=True)
    # Em um ambiente de produção, você pode querer sair ou ter um fallback.
    # Para desenvolvimento, apenas registraremos o erro.

def get_user_id_from_token():
    """
    Extrai o user_id do token JWT na requisição.
    Retorna None se o token for inválido ou não estiver presente.
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
    return payload.get('user_id')

@app.route('/health')
def health_check():
    """
    Endpoint para verificar se a API está online.
    """
    return jsonify({'status': 'ok', 'message': 'API is running!'}), 200

@app.route('/upload', methods=['POST'])
def upload_audio():
    """
    Endpoint para upload do arquivo de áudio final.
    Recebe o arquivo de áudio completo, salva-o, converte para WAV,
    e então envia o WAV para um microsserviço de denoising externo.
    Não requer autenticação JWT, usa "anonymous_user" se não logado.
    """
    user_id = "anonymous_user" # Default
    try:
        # Tenta obter user_id do token JWT. Se não, usa "anonymous_user".
        user_id = get_user_id_from_token() or "anonymous_user"
        logger.info(f"Requisição /upload recebida. User_id determinado: {user_id}")

        if 'audio' not in request.files:
            logger.error(f"User {user_id}: Nenhum arquivo de áudio enviado na requisição /upload.")
            return jsonify({"error": "Nenhum arquivo de áudio enviado"}), 400

        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            logger.error(f"User {user_id}: Arquivo de áudio vazio ou sem nome em /upload.")
            return jsonify({"error": "Arquivo de áudio vazio"}), 400

        session_id = request.form.get('session_id') or str(uuid.uuid4())
        logger.info(f"User {user_id}: Upload recebido para session_id: {session_id}")
        
        audio_data = audio_file.read()
        if not audio_data:
            logger.error(f"User {user_id}, Session {session_id}: Dados de áudio vazios após a leitura do arquivo.")
            return jsonify({"error": "Dados de áudio vazios"}), 400

        content_type = audio_file.content_type
        filename = audio_file.filename 
        logger.info(f"User {user_id}, Session {session_id}: Upload recebido - Content-Type: {content_type}, Nome do Arquivo: {filename}")

        # Salva o arquivo de áudio final (M4A) usando o método do AudioProcessor
        saved_m4a_path = audio_processor.save_final_audio(
            audio_data, 
            session_id, 
            filename=filename
        )
        logger.info(f"User {user_id}, Session {session_id}: Áudio M4A final salvo com sucesso em: {saved_m4a_path}")

        # Processa o áudio (converte M4A para WAV)
        processing_result = audio_processor.process_session(session_id)
        if processing_result["status"] == "error":
            logger.error(f"User {user_id}, Session {session_id}: Erro ao converter M4A para WAV: {processing_result['message']}")
            # Update MongoDB status to reflect conversion failure
            final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"status": "conversion_failed", "denoise_message": f"Falha na conversão para WAV: {processing_result['message']}", "created_at": time.time()}},
                upsert=True
            )
            return jsonify({
                "session_id": session_id,
                "message": f"Falha ao processar áudio: {processing_result['message']}",
                "denoise_service_status": "conversion_failed",
                "denoise_service_message": f"Falha na conversão de M4A para WAV."
            }), 500
        
        processed_wav_path_temp = processing_result['output_path'] 
        logger.info(f"User {user_id}, Session {session_id}: Áudio convertido para WAV em: {processed_wav_path_temp}")

        if not os.path.exists(processed_wav_path_temp) or os.path.getsize(processed_wav_path_temp) == 0:
            logger.error(f"User {user_id}, Session {session_id}: Arquivo WAV processado está faltando ou vazio: {processed_wav_path_temp}. Não é possível enviar para denoising.")
            # Update MongoDB status to reflect missing WAV
            final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"status": "wav_missing", "denoise_message": "Arquivo WAV temporário está faltando ou vazio.", "created_at": time.time()}},
                upsert=True
            )
            return jsonify({
                "session_id": session_id,
                "message": "Arquivo de áudio processado está faltando ou vazio. Denoising abortado.",
                "denoise_service_status": "wav_missing",
                "denoise_service_message": "Arquivo WAV temporário não encontrado para denoising."
            }), 500

        # --- Envio para o microsserviço de denoising ---
        denoise_service_url = os.getenv("DENOISE_SERVER", "http://10.67.57.148:8000/audio/denoise") # Usar variável de ambiente
        denoise_status = "unknown"
        denoise_message = "Mensagem de denoising inicial."
        processed_audio_path_for_client = None # Path a ser retornado ao cliente, apenas se denoising for síncrono e bem-sucedido

        try:
            with open(processed_wav_path_temp, 'rb') as audio_file_handle:
                files_to_send = {
                    'audio_file': (os.path.basename(processed_wav_path_temp), audio_file_handle, 'audio/wav'),
                }
                params_to_send = {
                    'intensity': 1.0, 
                    'session_id': session_id,
                    'user_id': user_id, # Envia o user_id (anonymous_user ou real) para o microsserviço
                    'filename': filename
                }

                logger.debug(f"User {user_id}, Session {session_id}: Enviando para o serviço de denoising - URL: {denoise_service_url}, Parâmetros: {params_to_send}")

                denoise_response = requests.post(
                    denoise_service_url, 
                    params=params_to_send, 
                    files=files_to_send, 
                    timeout=300 # Aumentei o timeout para 5 minutos
                )
            denoise_response.raise_for_status() # Lança HTTPError para status de erro (4xx ou 5xx)
            
            denoise_response_json = denoise_response.json()
            logger.info(f"User {user_id}, Session {session_id}: Resposta do serviço de denoising: {denoise_response_json}")
            
            # Assuming the denoising service returns a 'status' field
            denoise_service_internal_status = denoise_response_json.get('status', 'unknown')
            denoise_service_internal_message = denoise_response_json.get('message', 'Nenhuma mensagem específica do serviço de denoising.')

            if denoise_service_internal_status == 'success':
                denoise_status = "denoised_completed"
                denoise_message = "Áudio denoised e salvo com sucesso pelo microsserviço."
                # O microsserviço *deve* retornar o path final se for síncrono
                processed_audio_path_for_client = denoise_response_json.get('path') 
                if processed_audio_path_for_client:
                    # Se o microsserviço retorna o caminho completo, use-o.
                    # Se retornar apenas o nome do arquivo, construa a URL aqui.
                    # Ex: f"{request.url_root.rstrip('/')}/processed/{os.path.basename(processed_audio_path_for_client)}"
                    pass # O path já está pronto para ser enviado de volta
                else:
                    logger.warning(f"User {user_id}, Session {session_id}: Serviço de denoising retornou sucesso, mas sem 'path' para o áudio processado.")
                    denoise_status = "denoised_completed_no_path"
                    denoise_message = "Denoising completo, mas o caminho do áudio processado não foi retornado."

            else:
                denoise_status = "denoise_processing_failed"
                denoise_message = f"Denoising falhou no serviço: {denoise_service_internal_message}"

        except requests.exceptions.Timeout:
            logger.error(f"User {user_id}, Session {session_id}: Requisição do serviço de denoising excedeu o tempo limite (300s).")
            denoise_status = "denoise_timeout"
            denoise_message = "Requisição do serviço de denoising excedeu o tempo limite."
        except requests.exceptions.RequestException as req_err:
            error_response_text = req_err.response.text if req_err.response is not None else "No response body."
            logger.error(f"User {user_id}, Session {session_id}: Erro de requisição ao enviar áudio para o serviço de denoising: {req_err} - Resposta: {error_response_text}", exc_info=True)
            denoise_status = "denoise_send_failed"
            denoise_message = f"Falha ao enviar áudio para denoising: {req_err} - Resposta: {error_response_text}"
        except Exception as e: # Captura JSONDecodeError e outros erros
            logger.error(f"User {user_id}, Session {session_id}: Erro inesperado durante a chamada do serviço de denoising: {e}", exc_info=True)
            denoise_status = "denoise_send_failed"
            denoise_message = f"Erro inesperado durante a chamada do serviço de denoising: {e}"

        # Salva/Atualiza informações no MongoDB com o status final da tentativa de denoising
        try:
            # Tenta encontrar o documento existente para atualizar
            existing_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id})
            
            update_fields = {
                "user_id": user_id,
                "filename": filename, 
                "content_type": content_type,
                "saved_m4a_path": saved_m4a_path, 
                "processed_wav_path": processed_wav_path_temp, # Caminho para o WAV temporário
                "status": denoise_status, # Status da tentativa de denoising
                "denoise_message": denoise_message,
                "created_at": existing_doc.get("created_at", time.time()), # Mantém o timestamp original se existir
                "last_updated_at": time.time(), # Novo timestamp de atualização
                "final_denoised_path": processed_audio_path_for_client # Se o denoising foi síncrono e retornou o path
            }

            result_mongo_upload = final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": update_fields},
                upsert=True
            )
            if result_mongo_upload.upserted_id:
                logger.info(f"User {user_id}, Session {session_id}: Novo documento MongoDB INSERIDO (upload inicial/denoising). ID: {result_mongo_upload.upserted_id}")
            elif result_mongo_upload.modified_count > 0:
                logger.info(f"User {user_id}, Session {session_id}: Documento MongoDB ATUALIZADO (upload inicial/denoising).")
            else:
                logger.warning(f"User {user_id}, Session {session_id}: Documento MongoDB NÃO FOI INSERIDO/ATUALIZADO.")

        except Exception as mongo_err:
            logger.error(f"User {user_id}, Session {session_id}: Erro CRÍTICO ao salvar informações no MongoDB (rota /upload): {str(mongo_err)}", exc_info=True)

        # Limpa recursos M4A e WAV temporário (o WAV temporário só é limpo aqui se o denoising for síncrono e bem-sucedido)
        try:
            audio_processor.cleanup(session_id, cleanup_m4a=True, cleanup_temp_wav=(denoise_status == "denoised_completed"))
            logger.info(f"User {user_id}, Session {session_id}: Recursos M4A e/ou WAV temporário limpos após o envio para o serviço de denoising.")
        except Exception as cleanup_err:
            logger.error(f"User {user_id}, Session {session_id}: Erro ao limpar recursos para a sessão: {str(cleanup_err)}", exc_info=True)

        response_data = {
            "session_id": session_id,
            "message": denoise_message,
            "denoise_service_status": denoise_status,
            "denoise_service_message": denoise_message, # Redundante, mas útil para o frontend
            "processed_audio_path": processed_audio_path_for_client # Inclui o path se disponível
        }
        logger.info(f"User {user_id}, Session {session_id}: Resposta de upload: {response_data}")
        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"User {user_id}: Erro inesperado no endpoint /upload: {str(e)}", exc_info=True)
        return jsonify({"error": f"Erro interno do servidor: {str(e)}"}), 500
    
@app.route('/audio/<session_id>', methods=['GET'])
def get_audio(session_id):
    """
    Endpoint para recuperar o áudio processado de uma sessão.
    Serve o arquivo WAV final denoised da pasta 'processed_audios'.
    Não requer autenticação JWT, usa "anonymous_user" se não logado.
    """
    user_id = "anonymous_user"
    try:
        user_id = get_user_id_from_token() or "anonymous_user"
        logger.info(f"User {user_id}: Requisição /audio/{session_id} recebida.")

        audio_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id})
        
        if not audio_doc:
            logger.warning(f"User {user_id}, Session {session_id}: Documento de áudio não encontrado no MongoDB.")
            return jsonify({
                "status": "error",
                "message": "Arquivo de áudio não encontrado ou ainda não processado",
                "session_id": session_id
            }), 404
        
        file_to_serve_path = audio_doc.get('final_denoised_path')
        
        if not file_to_serve_path:
            logger.warning(f"User {user_id}, Session {session_id}: Caminho do áudio denoised final não definido. Áudio não pronto para ser servido.")
            return jsonify({
                "status": "processing", # Indica que pode estar em processamento
                "message": "Áudio processado final ainda não disponível.",
                "session_id": session_id,
                "current_status": audio_doc.get('status', 'unknown') # Retorna o status atual do MongoDB
            }), 202 # Retorna 202 Accepted para indicar que está em andamento

        logger.debug(f"User {user_id}, Session {session_id}: Tentando servir áudio do caminho: {file_to_serve_path}")

        if not os.path.exists(file_to_serve_path):
            logger.warning(f"User {user_id}, Session {session_id}: Arquivo de áudio não encontrado no sistema de arquivos em {file_to_serve_path}.")
            # Se o path existe no MongoDB mas o arquivo não, atualize o status
            final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"status": "file_not_found_on_disk", "denoise_message": "Arquivo denoised não encontrado no disco."}}
            )
            return jsonify({
                "status": "error",
                "message": "Arquivo de áudio não encontrado no servidor.",
                "session_id": session_id
            }), 404

        logger.info(f"User {user_id}, Session {session_id}: Servindo arquivo de áudio: {file_to_serve_path}")
        return send_file(file_to_serve_path, mimetype='audio/wav')

    except Exception as e:
        logger.error(f"User {user_id}, Session {session_id}: Erro ao recuperar áudio: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Erro ao recuperar áudio: {str(e)}",
            "session_id": session_id
        }), 500

@app.route('/audios/list', methods=['GET'])
def list_audios():
    """
    Endpoint para listar todos os arquivos de áudio para o usuário logado (ou anônimo).
    Retorna APENAS os áudios que foram marcados com o status "denoised_completed" e têm um 'final_denoised_path'.
    """
    user_id = "anonymous_user"
    try:
        user_id = get_user_id_from_token() or "anonymous_user"
        logger.info(f"User {user_id}: Requisição /audios/list recebida.")

        # Busca APENAS os áudios para este user_id que foram FINALIZADOS e têm o caminho denoised
        user_audios = final_audios_collection.find(
            {
                "user_id": user_id,
                "final_denoised_path": {"$ne": None}, # Garante que o caminho final existe
                "status": "denoised_completed"        # Garante que o status é de completo
            }
        ).sort("created_at", -1) # Ordena por tempo de criação, mais novo primeiro

        audio_list = []
        for audio_doc in user_audios:
            session_id = audio_doc.get("session_id")
            base_api_url = request.url_root.rstrip('/')
            
            # A URL do áudio sempre aponta para o endpoint /audio/<session_id>
            audio_url = f"{base_api_url}/audio/{session_id}"

            audio_list.append({
                "id": str(audio_doc["_id"]),
                "session_id": session_id,
                "title": f"Gravação Processada ({time.strftime('%d/%m/%Y %H:%M', time.localtime(audio_doc['created_at']))})",
                "path": audio_url,
                "created_at": audio_doc["created_at"],
                "status": audio_doc.get("status", "unknown") # Inclui o status para que o frontend possa exibir
            })
        
        logger.info(f"User {user_id}: Retornando {len(audio_list)} áudios *processados* para o usuário.")
        return jsonify(audio_list), 200

    except Exception as e:
        logger.error(f"User {user_id}: Erro ao listar áudios: {str(e)}", exc_info=True)
        return jsonify({'error': f"Erro interno do servidor: {str(e)}"}), 500
    
@app.route('/audio/<session_id>', methods=['DELETE'])
def delete_audio(session_id):
    """
    Endpoint para deletar um arquivo de áudio processado e seus metadados.
    """
    user_id = "anonymous_user"
    try:
        user_id = get_user_id_from_token() or "anonymous_user"
        logger.info(f"User {user_id}: Requisição /audio/{session_id} DELETE recebida.")

        audio_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id})

        if not audio_doc:
            logger.warning(f"User {user_id}, Session {session_id}: Áudio não encontrado para exclusão.")
            return jsonify({'error': 'Áudio não encontrado ou você não tem permissão para excluí-lo'}), 404

        # Obtém os caminhos para M4A (se ainda existir), WAV temporário e WAV denoised final
        saved_m4a_path = audio_doc.get("saved_m4a_path")
        processed_wav_path_temp = audio_doc.get("processed_wav_path")
        final_denoised_path = audio_doc.get("final_denoised_path")

        # Exclui os arquivos do sistema de arquivos se existirem
        files_to_delete = [saved_m4a_path, processed_wav_path_temp, final_denoised_path]
        for file_path in files_to_delete:
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"User {user_id}, Session {session_id}: Arquivo excluído: {file_path}")
                except OSError as e:
                    logger.warning(f"User {user_id}, Session {session_id}: Não foi possível excluir o arquivo {file_path}: {e}")
            else:
                logger.debug(f"User {user_id}, Session {session_id}: Arquivo não encontrado no sistema de arquivos para deletar: {file_path}")

        # Exclui o documento do MongoDB
        result_mongo_delete = final_audios_collection.delete_one({"session_id": session_id, "user_id": user_id})
        if result_mongo_delete.deleted_count > 0:
            logger.info(f"User {user_id}, Session {session_id}: Metadados de áudio excluídos do MongoDB.")
        else:
            logger.warning(f"User {user_id}, Session {session_id}: Metadados de áudio NÃO FORAM EXCLUÍDOS do MongoDB.")

        return jsonify({'message': 'Áudio excluído com sucesso'}), 200

    except Exception as e:
        logger.error(f"User {user_id}, Session {session_id}: Erro ao excluir áudio: {str(e)}", exc_info=True)
        return jsonify({'error': f"Erro interno do servidor: {str(e)}"}), 500

@app.route('/clear_audio', methods=['POST'])
def clear_audio():
    """
    Endpoint para receber um arquivo de áudio de outro microsserviço (o serviço de denoising)
    e salvá-lo diretamente na pasta processed_output_folder.
    Também atualiza o registro do MongoDB para a sessão correspondente.
    Este endpoint não requer autenticação JWT, pois é chamado internamente por outro serviço.
    """
    user_id = "anonymous_user"
    session_id = "anonymous_session"
    try:
        # Obtém session_id e user_id dos dados do formulário (enviado pelo microsserviço)
        session_id_from_form = request.form.get('session_id')
        user_id_from_form = request.form.get('user_id')
        
        # Prioriza o user_id vindo do microsserviço
        if user_id_from_form:
            user_id = user_id_from_form

        if session_id_from_form:
            session_id = session_id_from_form

        if not session_id:
            logger.error("Requisição /clear_audio sem session_id. Não é possível associar ao documento existente.")
            return jsonify({"error": "session_id é obrigatório para /clear_audio"}), 400
        
        logger.info(f"User {user_id}, Session {session_id}: Requisição /clear_audio recebida.")

        if 'audio' not in request.files:
            logger.error(f"User {user_id}, Session {session_id}: Nenhum arquivo de áudio enviado na requisição /clear_audio.")
            return jsonify({"error": "Nenhum arquivo de áudio enviado"}), 400

        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            logger.error(f"User {user_id}, Session {session_id}: Arquivo de áudio vazio ou sem nome em /clear_audio.")
            return jsonify({"error": "Arquivo de áudio vazio"}), 400

        original_filename = request.form.get('filename', audio_file.filename) # Tenta pegar o nome original do form data
        if not original_filename:
            original_filename = f"denoised_audio_{session_id}.wav" # Fallback
            
        # Gera um nome de arquivo único para o áudio salvo na pasta processed_output_folder
        # Garante que o nome do arquivo termine com .wav
        base_name, ext = os.path.splitext(original_filename)
        unique_filename = f"denoised_{session_id}_{uuid.uuid4().hex}{ext if ext else '.wav'}"
        if not unique_filename.lower().endswith('.wav'):
            unique_filename += '.wav'
        
        audio_content = audio_file.read()

        saved_processed_path = audio_processor.save_processed_audio_from_external(
            audio_content, unique_filename
        )

        if not os.path.exists(saved_processed_path) or os.path.getsize(saved_processed_path) == 0:
            logger.error(f"User {user_id}, Session {session_id}: Arquivo de áudio NÃO foi salvo ou está vazio após a tentativa de salvar: {saved_processed_path}")
            # Tentar atualizar o status no MongoDB para indicar falha de salvamento do denoised
            final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"status": "denoised_file_save_failed", "denoise_message": "Falha ao salvar o arquivo denoised retornado.", "last_updated_at": time.time()}}
            )
            return jsonify({"error": "Falha ao salvar o arquivo de áudio ou o arquivo está vazio após salvar"}), 500
        
        logger.info(f"User {user_id}, Session {session_id}: Áudio recebido e salvo com sucesso em processed_output_folder: {saved_processed_path} (Tamanho: {os.path.getsize(saved_processed_path)} bytes)")

        # Atualiza o registro do MongoDB para esta sessão
        result_mongo_clear = final_audios_collection.update_one(
            {"session_id": session_id, "user_id": user_id},
            {"$set": {
                "final_denoised_path": saved_processed_path,
                "status": "denoised_completed", # Status final de sucesso!
                "denoise_message": "Áudio denoised e salvo com sucesso.",
                "last_updated_at": time.time()
            }},
            upsert=True # Se o documento não existir (o que pode acontecer se o upload original falhou antes de salvar no mongo)
        )
        if result_mongo_clear.upserted_id:
            logger.info(f"User {user_id}, Session {session_id}: Novo documento MongoDB INSERIDO (áudio denoised). ID: {result_mongo_clear.upserted_id}")
        elif result_mongo_clear.modified_count > 0:
            logger.info(f"User {user_id}, Session {session_id}: Documento MongoDB ATUALIZADO (áudio denoised).")
        else:
            logger.warning(f"User {user_id}, Session {session_id}: Documento MongoDB NÃO FOI INSERIDO/ATUALIZADO por /clear_audio. Isso pode indicar um session_id incorreto ou um documento já finalizado/excluído.")

        # Limpa o arquivo WAV temporário agora que o áudio denoised final foi salvo
        try:
            # Precisa garantir que o processed_wav_path esteja no documento para limpar
            audio_doc_for_cleanup = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id})
            if audio_doc_for_cleanup and audio_doc_for_cleanup.get("processed_wav_path"):
                temp_wav_path = audio_doc_for_cleanup["processed_wav_path"]
                if os.path.exists(temp_wav_path):
                    os.remove(temp_wav_path)
                    logger.info(f"User {user_id}, Session {session_id}: WAV temporário limpo: {temp_wav_path}.")
                else:
                    logger.warning(f"User {user_id}, Session {session_id}: WAV temporário não encontrado no disco para limpeza: {temp_wav_path}.")
            else:
                logger.debug(f"User {user_id}, Session {session_id}: Nenhum WAV temporário registrado para limpeza.")
        except Exception as cleanup_err:
            logger.error(f"User {user_id}, Session {session_id}: Erro ao limpar WAV temporário: {str(cleanup_err)}", exc_info=True)


        # Remove os dados de sessão do audio_processor, pois o processamento está completo
        audio_processor.remove_session_data(session_id)
        logger.info(f"User {user_id}, Session {session_id}: Dados da sessão removidos do AudioProcessor.")


        return jsonify({
            "status": "success",
            "message": "Áudio salvo com sucesso no diretório processado e metadados atualizados",
            "filename": unique_filename,
            "session_id": session_id,
            "user_id": user_id,
            "path": f"{request.url_root.rstrip('/')}/processed/{unique_filename}" # Usa /processed para servir
        }), 200

    except Exception as e:
        logger.error(f"User {user_id}: Erro no endpoint /clear_audio: {str(e)}", exc_info=True)
        return jsonify({"error": f"Erro interno do servidor: {str(e)}"}), 500

# --- Rotas que podem ser desativadas ou simplificadas ---
# A rota /process/<session_id> parece redundante agora que /upload lida com a conversão e envio.
# Eu a removeria a menos que haja um caso de uso específico para re-processar.
@app.route('/process/<session_id>', methods=['POST'])
def process_audio(session_id):
    """
    Endpoint para processar o arquivo de áudio final de uma sessão.
    Converte o áudio M4A para WAV.
    NOTA: Com a rota /upload agora lidando com o processamento, esta rota pode se tornar redundante
    ou servir como um gatilho de processamento explícito diferente.
    Não requer autenticação JWT, usa "anonymous_user" se não logado.
    """
    logger.warning(f"Endpoint /process/{session_id} foi chamado. Considerar se esta rota ainda é necessária ou deve ser integrada em /upload.")
    user_id = "anonymous_user"
    try:
        user_id = get_user_id_from_token() or "anonymous_user"
        logger.info(f"User {user_id}: Requisição /process/{session_id} recebida.")

        mongo_doc = final_audios_collection.find_one({"session_id": session_id, "user_id": user_id, "saved_m4a_path": {"$ne": None}})
        if not mongo_doc:
            logger.warning(f"User {user_id}, Session {session_id}: Sessão não encontrada no MongoDB ou M4A não enviado/pronto para processamento.")
            return jsonify({
                "status": "error",
                "message": "Sessão não encontrada ou áudio M4A não enviado/pronto para processamento",
                "session_id": session_id
            }), 404
        
        if session_id not in audio_processor.session_data:
            audio_processor.session_data[session_id] = {
                'final_m4a_path': mongo_doc['saved_m4a_path'],
                'status': mongo_doc.get('status', 'uploaded')
            }
            logger.info(f"User {user_id}, Session {session_id}: Sessão re-inicializada do MongoDB para processamento.")

        logger.info(f"User {user_id}, Session {session_id}: Iniciando processamento.")
        result = audio_processor.process_session(session_id)
        
        if result["status"] == "error":
            logger.error(f"User {user_id}, Session {session_id}: Erro ao processar sessão: {result['message']}")
            # Atualiza o status no MongoDB para indicar falha na conversão
            final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"status": "conversion_failed", "denoise_message": result['message'], "last_updated_at": time.time()}}
            )
            return jsonify(result), 500

        logger.info(f"User {user_id}, Session {session_id}: Sessão processada com sucesso. Saída: {result.get('output_path')}")

        # Atualiza o MongoDB com o caminho WAV processado e o status
        try:
            result_mongo_process = final_audios_collection.update_one(
                {"session_id": session_id, "user_id": user_id},
                {"$set": {"processed_wav_path": result['output_path'], "status": "processed_wav_generated", "last_updated_at": time.time()}}
            )
            if result_mongo_process.modified_count > 0:
                logger.info(f"User {user_id}, Session {session_id}: MongoDB atualizado com o caminho processado.")
            else:
                logger.warning(f"User {user_id}, Session {session_id}: Documento MongoDB NÃO FOI ATUALIZADO (processamento).")
        except Exception as mongo_update_err:
            logger.error(f"User {user_id}, Session {session_id}: Erro ao atualizar MongoDB com o caminho processado (rota /process): {str(mongo_update_err)}", exc_info=True)
        
        # Não limpa o WAV temporário aqui, pois ele ainda será enviado para o denoising
        # A limpeza do WAV temporário deve ocorrer APENAS após o /clear_audio retornar sucesso.
        try:
            audio_processor.cleanup(session_id, cleanup_m4a=True, cleanup_temp_wav=False)
            logger.info(f"User {user_id}, Session {session_id}: Recursos M4A limpos após o processamento.")
        except Exception as cleanup_err:
            logger.error(f"User {user_id}, Session {session_id}: Erro ao limpar recursos M4A: {str(cleanup_err)}", exc_info=True)
            
        return jsonify(result), 200

    except Exception as e:
        logger.error(f"User {user_id}, Session {session_id}: Erro inesperado no endpoint /process: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": f"Erro interno do servidor ao processar áudio: {str(e)}",
            "session_id": session_id
        }), 500


@app.route('/processed/<filename>')
def serve_processed_file(filename):
    """
    Endpoint para servir arquivos processados diretamente pelo nome do arquivo.
    Esta rota agora serve exclusivamente da pasta processed_output_folder.
    Não requer autenticação JWT.
    """
    try:
        full_path = os.path.join(audio_processor.processed_output_folder, filename)
        logger.info(f"Servindo arquivo processado: {filename} do diretório {audio_processor.processed_output_folder}")
        return send_from_directory(audio_processor.processed_output_folder, filename)
    except Exception as e:
        logger.error(f"Erro ao servir arquivo {filename}: {str(e)}", exc_info=True)
        return jsonify({'error': 'Arquivo não encontrado ou erro interno'}), 404


if __name__ == '__main__':
    # In a production environment, use a WSGI server like Gunicorn or uWSGI.
    # debug=True is only for development.
    app.run(host='0.0.0.0', port=5000, debug=True)