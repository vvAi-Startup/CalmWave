from flask import Flask, request, jsonify, send_file, render_template, send_from_directory
from flask_cors import CORS
import shutil
from auth import auth_bp, verify_token # Removed authentication imports
from audio_processor import AudioProcessor # Ensure AudioProcessor is the updated version
from dotenv import load_dotenv
import os
import uuid
import logging
import time
from pymongo import MongoClient
from bson.objectid import ObjectId # Not needed for simplified approach
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
        "methods": ["GET", "POST", "DELETE", "OPTIONS", "PUT"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
 
# app.register_blueprint(auth_bp, url_prefix='/auth') # Removed auth blueprint registration
 
# Inicializa o processador de áudio
audio_processor = AudioProcessor()
 
# Conecta ao MongoDB
try:
    mongo_uri = os.getenv('MONGO_URI')
    if not mongo_uri:
        raise ValueError("Variável de ambiente 'MONGO_URI' não está definida.")
    mongo = MongoClient(mongo_uri)
    db = mongo['calmwave']
    # Simplified collection for just saving file metadata
    audios_collection = db['audios'] 
    logger.info("Conectado ao MongoDB com sucesso.")
except Exception as e:
    logger.error(f"Erro ao conectar ao MongoDB: {str(e)}", exc_info=True)
 
# No need for get_user_id_from_token in simplified version
 
@app.route('/health')
def health_check():
    """
    Endpoint para verificar se a API está online.
    """
    return jsonify({'status': 'ok', 'message': 'API is running!'}), 200
 
@app.route('/upload', methods=['POST'])
def upload_audio():
    """
    SIMPLIFIED: Endpoint for audio upload.
    Receives an audio file, saves it, converts to WAV (if needed),
    and sends to an external denoising service.
    Only saves minimal info to DB. No user/session tracking.
    """
    try:
        if 'audio' not in request.files:
            logger.error("Nenhum arquivo de áudio enviado na requisição /upload.")
            return jsonify({"error": "Nenhum arquivo de áudio enviado"}), 400
 
        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            logger.error("Arquivo de áudio vazio ou sem nome em /upload.")
            return jsonify({"error": "Arquivo de áudio vazio"}), 400
 
        # Generate a simple unique ID for this upload, no sessions
        upload_id = str(uuid.uuid4())
        filename = audio_file.filename or f"audio_{upload_id}.m4a"
        content_type = audio_file.content_type or "audio/unknown"
        
        logger.info(f"Upload recebido. ID: {upload_id}, Nome do Arquivo: {filename}")
 
        audio_data = audio_file.read()
        if not audio_data:
            logger.error(f"Upload ID {upload_id}: Dados de áudio vazios após a leitura do arquivo.")
            return jsonify({"error": "Dados de áudio vazios"}), 400
 
        # Save the final M4A audio
        saved_m4a_path = audio_processor.save_final_audio(
            audio_data,
            upload_id, # Using upload_id as session_id for AudioProcessor
            filename=filename
        )
        logger.info(f"ID {upload_id}: Áudio M4A salvo em: {saved_m4a_path}")
 
        # Convert M4A to WAV
        processing_result = audio_processor.process_session(upload_id)
        if processing_result["status"] == "error":
            logger.error(f"ID {upload_id}: Erro ao converter M4A para WAV: {processing_result['message']}")
            # Minimal DB save for conversion failure
            audios_collection.insert_one({
                "upload_id": upload_id or 'unknown_upload',
                "original_filename": filename or 'unknown_file',
                "status": "conversion_failed ",
                "message": processing_result['message'],
                "created_at": time.time()
            })
            return jsonify({
                "upload_id": upload_id or 'unknown_upload',
                "message": f"Falha na conversão para WAV: {processing_result['message']}"
            }), 500
        
        processed_wav_path_temp = processing_result['output_path']
        logger.info(f"ID {upload_id}: Áudio convertido para WAV em: {processed_wav_path_temp}")
 
        if not os.path.exists(processed_wav_path_temp) or os.path.getsize(processed_wav_path_temp) == 0:
            logger.error(f"ID {upload_id}: Arquivo WAV processado está faltando ou vazio. Não é possível enviar para denoising.")
            # Minimal DB save for missing WAV
            audios_collection.insert_one({
                "upload_id": upload_id or 'unknown_upload',
                "original_filename": filename or 'unknown_file',
                "content_type": content_type or 'unknown_content_type',
                "status": "wav_missing" or "wav_empty",
                "message": "Arquivo WAV temporário está faltando ou vazio.",
                "created_at": time.time()
            })
            return jsonify({
                "upload_id": upload_id,
                "message": "Arquivo de áudio processado está faltando ou vazio. Denoising abortado."
            }), 500
 
        # --- Send to denoising microservice ---
        denoise_service_url = os.getenv("DENOISE_SERVER", "http://10.67.57.148:8000/audio/denoise")
        denoise_status = "unknown"
        denoise_message = "Mensagem de denoising inicial."
        processed_audio_url = None 
 
        try:
            with open(processed_wav_path_temp, 'rb') as audio_file_handle:
                files_to_send = {
                    'audio_file': (os.path.basename(processed_wav_path_temp), audio_file_handle, 'audio/wav'),
                }
                params_to_send = {
                    'intensity': 1.0,
                    'upload_id': upload_id or 'unknown_upload', # Send upload_id to denoising service
                    'filename': filename or f"denoised_{upload_id}.wav", # Send original filename or generated name
                }
 
                logger.debug(f"ID {upload_id}: Enviando para o serviço de denoising - URL: {denoise_service_url}, Parâmetros: {params_to_send}")
 
                denoise_response = requests.post(
                    denoise_service_url,
                    params=params_to_send,
                    files=files_to_send,
                    timeout=300
                )
            denoise_response.raise_for_status()
            
            try:
                denoise_response_json = denoise_response.json()
                logger.info(f"ID {upload_id}: Resposta do serviço de denoising: {denoise_response_json}")
                
                denoise_service_internal_status = denoise_response_json.get('status', 'unknown')
                denoise_service_internal_message = denoise_response_json.get('message', 'Nenhuma mensagem específica do serviço de denoising.')
 
                if denoise_service_internal_status == 'success':
                    denoise_status = "denoised_completed"
                    denoise_message = "Áudio denoised e salvo com sucesso pelo microsserviço."
                    processed_audio_url = denoise_response_json.get('path') # Path from denoising service
                    if not processed_audio_url:
                        logger.warning(f"ID {upload_id}: Serviço de denoising retornou sucesso, mas sem 'path' para o áudio processado.")
                        denoise_status = "denoised_completed_no_path"
                        denoise_message = "Denoising completo, mas o caminho do áudio processado não foi retornado."
                else:
                    denoise_status = "denoise_processing_failed"
                    denoise_message = f"Denoising falhou no serviço: {denoise_service_internal_message}"
            except requests.exceptions.JSONDecodeError as json_err:
                error_response_text = denoise_response.text if denoise_response.text else "No response body."
                logger.error(f"ID {upload_id}: Erro de JSON ao parsear resposta do serviço de denoising: {json_err} - Resposta bruta: '{error_response_text}'", exc_info=True)
                denoise_status = "denoise_send_failed"
                denoise_message = f"Resposta inválida do serviço de denoising: {json_err} - Resposta: {error_response_text}"
 
        except requests.exceptions.Timeout:
            logger.error(f"ID {upload_id}: Requisição do serviço de denoising excedeu o tempo limite (300s).")
            denoise_status = "denoise_timeout"
            denoise_message = "Requisição do serviço de denoising excedeu o tempo limite."
        except requests.exceptions.RequestException as req_err:
            error_response_text = req_err.response.text if req_err.response is not None else "No response body."
            logger.error(f"ID {upload_id}: Erro de requisição ao enviar áudio para o serviço de denoising: {req_err} - Resposta: {error_response_text}", exc_info=True)
            denoise_status = "denoise_send_failed"
            denoise_message = f"Falha ao enviar áudio para denoising: {req_err} - Resposta: {error_response_text}"
        except Exception as e:
            logger.error(f"ID {upload_id}: Erro inesperado durante a chamada do serviço de denoising: {e}", exc_info=True)
            denoise_status = "denoise_send_failed"
            denoise_message = f"Erro inesperado durante a chamada do serviço de denoising: {e}"
 
        # Minimal DB save/update
        try:
            audios_collection.update_one(
                {"upload_id": upload_id},
                {"$set": {
                    "original_filename": filename or 'unknown_file', # Save original filename
                    "content_type": content_type or 'unknown_content_type',
                    "saved_m4a_path": saved_m4a_path or 'unknown_path', # Save M4A path
                    "processed_wav_path": processed_wav_path_temp or os.path(processed_audio_url), # Temp path is recorded even if denoising fails
                    "final_denoised_url": processed_audio_url, # URL from denoising service
                    "status": denoise_status,
                    "message": denoise_message,
                    "created_at": time.time(), # Always set created_at on initial entry
                    "last_updated_at": time.time()
                }},
                upsert=True # Create if not exists, update if exists
            )
            logger.info(f"ID {upload_id}: Informações salvas/atualizadas no MongoDB.")
        except Exception as mongo_err:
            logger.error(f"ID {upload_id}: Erro CRÍTICO ao salvar informações no MongoDB (rota /upload): {str(mongo_err)}", exc_info=True)
 
        # Clean up temporary resources (M4A and WAV)
        try:
            # Clean up the M4A original upload directory
            audio_processor.cleanup(upload_id, cleanup_m4a=True, cleanup_temp_wav=False) # WAV is only cleaned if denoising is successful AND external service confirms
            logger.info(f"ID {upload_id}: Recursos M4A temporários limpos.")
        except Exception as cleanup_err:
            logger.error(f"ID {upload_id}: Erro ao limpar recursos temporários: {str(cleanup_err)}", exc_info=True)
 
        response_data = {
            "upload_id": upload_id,
            "message": denoise_message,
            "status": denoise_status,
            "processed_audio_url": processed_audio_url # Return the URL provided by denoising service
        }
        logger.info(f"ID {upload_id}: Resposta de upload: {response_data}")
        return jsonify(response_data), 200
 
    except Exception as e:
        logger.error(f"Erro inesperado no endpoint /upload: {str(e)}", exc_info=True)
        return jsonify({"error": f"Erro interno do servidor: {str(e)}"}), 500
    
 
@app.route('/clear_audio', methods=['POST'])
def clear_audio():
    """
    SIMPLIFIED: Endpoint to receive a processed audio file from the denoising microservice
    and save it. Updates minimal info in the database.
    No user/session tracking directly on this route.
    """
    upload_id = "unknown_upload"
    try:
        # Get upload_id from form data (sent by the microservice)
        upload_id_from_form = request.form.get('upload_id')
        upload_id = upload_id_from_form or str(uuid.uuid4())
 
        if not upload_id_from_form: # Log if no specific upload_id is provided by the service
            logger.warning(f"Requisição /clear_audio recebida sem upload_id específico. Usando gerado: {upload_id}")
        
        logger.info(f"ID {upload_id}: Requisição /clear_audio recebida.")
 
        if 'audio' not in request.files:
            logger.error(f"ID {upload_id}: Nenhum arquivo de áudio enviado na requisição /clear_audio.")
            return jsonify({"error": "Nenhum arquivo de áudio enviado"}), 400
 
        audio_file = request.files['audio']
        if not audio_file or audio_file.filename == '':
            logger.error(f"ID {upload_id}: Arquivo de áudio vazio ou sem nome em /clear_audio.")
            return jsonify({"error": "Arquivo de áudio vazio"}), 400
 
        original_filename = request.form.get('filename') or audio_file.filename or f"denoised_audio_{upload_id}.wav"
        
        # Generate a unique filename for the processed audio
        base_name, ext = os.path.splitext(original_filename)
        unique_filename = f"denoised_{upload_id}_{uuid.uuid4().hex}{ext if ext else '.wav'}"
        if not unique_filename.lower().endswith('.wav'):
            unique_filename += '.wav'
        
        audio_content = audio_file.read()
 
        saved_processed_path = audio_processor.save_processed_audio_from_external(
            audio_content, unique_filename
        )
 
        if not os.path.exists(saved_processed_path) or os.path.getsize(saved_processed_path) == 0:
            logger.error(f"ID {upload_id}: Arquivo de áudio NÃO foi salvo ou está vazio após a tentativa de salvar: {saved_processed_path}")
            # Update DB status to reflect denoised save failure
            audios_collection.update_one(
                {"upload_id": upload_id},
                {"$set": {"status": "denoised_file_save_failed", "message": "Falha ao salvar o arquivo denoised retornado.", "last_updated_at": time.time()}},
                upsert=False # Only update existing, don't create new here if upload_id was unrecognized
            )
            return jsonify({"error": "Falha ao salvar o arquivo de áudio ou o arquivo está vazio após salvar"}), 500
        
        logger.info(f"ID {upload_id}: Áudio recebido e salvo com sucesso em processed_output_folder: {saved_processed_path} (Tamanho: {os.path.getsize(saved_processed_path)} bytes)")
 
        # Update MongoDB for this upload_id
        try:
            # Ensure 'created_at' exists if this is the first time we're seeing this upload_id
            existing_doc = audios_collection.find_one({"upload_id": upload_id})
            created_at_val = existing_doc.get("created_at", time.time()) if existing_doc else time.time()
 
            update_data = {
                "final_denoised_path": saved_processed_path,
                "status": "denoised_completed",
                "message": "Áudio denoised e salvo com sucesso.",
                "last_updated_at": time.time()
            }
            # Add created_at only if it's a new document being upserted
            if not existing_doc:
                update_data["created_at"] = created_at_val
                update_data["original_filename"] = original_filename # Add basic info for new entry
                update_data["content_type"] = "audio/wav" # Assume wav from denoising service
 
            result_mongo_clear = audios_collection.update_one(
                {"upload_id": upload_id},
                {"$set": update_data},
                upsert=True # Upsert for simplicity, handles if /upload didn't get to save properly
            )
            if result_mongo_clear.upserted_id:
                logger.info(f"ID {upload_id}: Novo documento MongoDB INSERIDO (áudio denoised). ID: {result_mongo_clear.upserted_id}")
            elif result_mongo_clear.modified_count > 0:
                logger.info(f"ID {upload_id}: Documento MongoDB ATUALIZADO (áudio denoised).")
            else:
                logger.warning(f"ID {upload_id}: Documento MongoDB NÃO FOI INSERIDO/ATUALIZADO por /clear_audio.")
 
        except Exception as e:
            logger.error(f"ID {upload_id}: Erro ao atualizar MongoDB (rota /clear_audio): {str(e)}", exc_info=True)
 
        # Clean up the temporary WAV file now that the final denoised audio is saved
        try:
            # Find the original doc to get the temp WAV path
            audio_doc_for_cleanup = audios_collection.find_one({"upload_id": upload_id})
            if audio_doc_for_cleanup and audio_doc_for_cleanup.get("processed_wav_path"):
                temp_wav_path = audio_doc_for_cleanup["processed_wav_path"]
                if os.path.exists(temp_wav_path):
                    os.remove(temp_wav_path)
                    logger.info(f"ID {upload_id}: WAV temporário limpo: {temp_wav_path}.")
                else:
                    logger.warning(f"ID {upload_id}: WAV temporário não encontrado no disco para limpeza: {temp_wav_path}.")
            else:
                logger.debug(f"ID {upload_id}: Nenhum WAV temporário registrado para limpeza.")
        except Exception as cleanup_err:
            logger.error(f"ID {upload_id}: Erro ao limpar WAV temporário: {str(cleanup_err)}", exc_info=True)
 
        # Remove session data from audio_processor (this might clear M4A temp too if not already)
        audio_processor.remove_session_data(upload_id)
        logger.info(f"ID {upload_id}: Dados da sessão removidos do AudioProcessor.")
 
        return jsonify({
            "status": "success",
            "message": "Áudio salvo com sucesso no diretório processado e metadados atualizados",
            "filename": unique_filename,
            "upload_id": upload_id,
            "path": f"{request.url_root.rstrip('/')}/processed/{unique_filename}"
        }), 200
 
    except Exception as e:
        logger.error(f"Erro no endpoint /clear_audio: {str(e)}", exc_info=True)
        return jsonify({"error": f"Erro interno do servidor: {str(e)}"}), 500

# This route is optional, to list all audios saved (very simplified)
@app.route('/audios/list', methods=['GET'])
def list_audios_simplified():
    """
    Endpoint simplificado para listar áudios.
    Retorna uma lista de áudios processados com informações básicas.
    """
    try:
        # Define o diretório padrão como 'processed'
        processed_dir = os.path.join(os.getcwd(), 'processed')
        
        if not os.path.exists(processed_dir):
            return jsonify({
                "status": "error",
                "message": "Nenhum áudio encontrado",
                "data": []
            }), 404

        audio_files = []
        for filename in os.listdir(processed_dir):
            if filename.endswith(('.wav', '.m4a')):
                file_path = os.path.join(processed_dir, filename)
                file_stats = os.stat(file_path)
                audio_files.append({
                    "id": str(uuid.uuid4()),
                    "filename": filename,
                    "path": f"/processed/{filename}",
                    "size": file_stats.st_size,
                    "created_at": file_stats.st_ctime
                })

        if not audio_files:
            return jsonify({
                "status": "success",
                "message": "Nenhum áudio encontrado",
                "data": []
            }), 200

        return jsonify({
            "status": "success",
            "message": "Áudios listados com sucesso",
            "data": audio_files
        }), 200

    except Exception as e:
        logger.error(f"Erro ao listar áudios: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Erro ao listar áudios",
            "error": str(e),
            "data": []
        }), 500
 
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)