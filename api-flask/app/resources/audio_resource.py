from flask import Blueprint, request, jsonify, send_from_directory, current_app
import os
import uuid
import time
from app.services.audio_service import AudioService
from app.extensions import logger
from datetime import datetime
from werkzeug.utils import secure_filename

audio_bp = Blueprint('audio', __name__)

# Constantes para nomes padrão
DEFAULT_FILENAME = "audio_sem_nome"
DEFAULT_CONTENT_TYPE = "audio/unknown"
DEFAULT_STATUS = "unknown"
DEFAULT_MESSAGE = "Nenhuma mensagem disponível"
DEFAULT_PATH = "sem_caminho"
DEFAULT_SESSION = "sessao_padrao"

@audio_bp.route('/health')
def health_check():
    """Endpoint para verificar se a API está online."""
    return jsonify({'status': 'ok', 'message': 'API is running!'}), 200

@audio_bp.route('/upload', methods=['POST'])
def upload_audio():
    """Endpoint para upload de áudio."""
    if 'file' not in request.files:
        return jsonify({"error": "Nenhum arquivo enviado"}), 400
        
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "Nenhum arquivo selecionado"}), 400
        
    try:
        # Garante que o diretório temp existe
        temp_folder = current_app.config.get('TEMP_FOLDER', os.path.join(os.getcwd(), 'temp'))
        os.makedirs(temp_folder, exist_ok=True)
        
        # Salva o arquivo temporariamente
        temp_path = os.path.join(temp_folder, secure_filename(file.filename))
        file.save(temp_path)
        
        # Gera um ID único para o upload
        upload_id = str(uuid.uuid4())
        
        # Registra o áudio no banco de dados
        audio_service = current_app.audio_service
        audio_doc_id = audio_service.audio_model.create({
            "upload_id": upload_id,
            "original_filename": secure_filename(file.filename),
            "status": "uploaded",
            "uploaded_at": datetime.utcnow(),
            "temp_path": temp_path,
            "message": "Arquivo enviado com sucesso"
        })
        
        if not audio_doc_id:
            return jsonify({"error": "Falha ao registrar metadados do áudio"}), 500
        
        # Converte para WAV
        conversion_result = audio_service.convert_to_wav(temp_path, upload_id)
        
        if not conversion_result["success"]:
            return jsonify({"error": conversion_result["message"]}), 500
            
        # Envia para denoise
        denoise_response, denoise_status_code = audio_service.send_to_denoise(
            conversion_result["output_path"],
            upload_id,
            secure_filename(file.filename)
        )
        
        if denoise_status_code >= 400:
            return jsonify(denoise_response), denoise_status_code
            
        return jsonify({
            "message": "Arquivo enviado com sucesso",
            "upload_id": upload_id,
            "denoise_status": denoise_response.get("message", "Enviado para denoise com sucesso")
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no upload: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500
    finally:
        # Limpa o arquivo temporário
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)

@audio_bp.route('/clear_audio', methods=['POST'])
def clear_audio():
    """Endpoint para receber o áudio processado do serviço de denoising."""
    upload_id = None
    try:
        upload_id = request.form.get('upload_id')
        if not upload_id:
            logger.warning("Requisição /clear_audio recebida sem upload_id específico.")
            return jsonify({
                "error": "upload_id não fornecido",
                "status": "error",
                "message": "O upload_id é obrigatório"
            }), 400

        logger.info(f"ID {upload_id}: Requisição /clear_audio recebida.")

        if 'audio' not in request.files:
            logger.error(f"ID {upload_id}: Nenhum arquivo de áudio enviado na requisição /clear_audio.")
            return jsonify({
                "error": "Nenhum arquivo de áudio enviado",
                "status": "error",
                "message": "Por favor, envie um arquivo de áudio válido"
            }), 400

        audio_file = request.files['audio']
        original_filename = request.form.get('filename', 'audio.wav')
        unique_filename = f"denoised_{upload_id}_{uuid.uuid4().hex}.wav"

        # Usa a instância do serviço de áudio do app
        audio_service = current_app.audio_service

        # Verifica se o upload_id existe no banco
        audio_doc = audio_service.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            logger.error(f"ID {upload_id}: Upload ID não encontrado no banco de dados.")
            return jsonify({
                "error": "Upload ID não encontrado",
                "status": "error",
                "message": "O upload_id fornecido não existe no banco de dados"
            }), 404

        # Salva o arquivo processado
        saved_processed_path = audio_service.save_processed_audio(audio_file.read(), unique_filename)
        if not saved_processed_path:
            logger.error(f"ID {upload_id}: Falha ao salvar o arquivo processado.")
            return jsonify({
                "error": "Falha ao salvar arquivo processado",
                "status": "error",
                "message": "Não foi possível salvar o arquivo de áudio processado"
            }), 500

        # Atualiza metadados
        update_result = audio_service.update_audio_metadata(upload_id, {
            'status': 'processed',
            'processed_path': saved_processed_path,
            'final_denoise_path': saved_processed_path,
            'processed_filename': unique_filename,
            'processed_at': datetime.utcnow(),
            'last_updated_at': datetime.utcnow(),
            'message': 'Arquivo processado com sucesso'
        })

        if not update_result:
            logger.error(f"ID {upload_id}: Falha ao atualizar metadados no banco de dados.")
            return jsonify({
                "error": "Falha ao atualizar metadados",
                "status": "error",
                "message": "Não foi possível atualizar os metadados do áudio no banco de dados"
            }), 500

        # Limpa arquivos temporários
        audio_service.cleanup_temp_files(upload_id)

        logger.info(f"ID {upload_id}: Arquivo processado salvo com sucesso em {saved_processed_path}")

        return jsonify({
            "status": "success",
            "message": "Arquivo processado salvo com sucesso",
            "upload_id": upload_id,
            "processed_path": saved_processed_path
        }), 200

    except Exception as e:
        logger.error(f"Erro no processamento do áudio: {str(e)}")
        return jsonify({
            "error": "Erro interno",
            "status": "error",
            "message": str(e)
        }), 500

@audio_bp.route('/list', methods=['GET'])
def list_audios():
    try:
        audio_service = current_app.audio_service
        base_url = request.host_url.rstrip('/')
        audios = audio_service.list_processed_audios(base_url)
        
        return jsonify({
            "status": "success",
            "message": "Áudios listados com sucesso",
            "data": audios
        }), 200
    except Exception as e:
        logger.error(f"Erro ao listar áudios: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro ao listar áudios: {str(e)}"
        }), 500

@audio_bp.route('/processed/<filename>')
def serve_processed_audio(filename):
    """Endpoint para servir arquivos de áudio processados."""
    try:
        # Usa a instância do serviço de áudio do app
        audio_service = current_app.audio_service
        return audio_service.serve_audio_file(filename)
    except Exception as e:
        logger.error(f"Erro ao servir arquivo {filename}: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro ao servir arquivo: {str(e)}"
        }), 500

@audio_bp.route('/delete/<upload_id>', methods=['DELETE'])
def delete_audio(upload_id):
    """Endpoint para deletar um áudio."""
    try:
        audio_service = current_app.audio_service
        
        # Verifica se o áudio existe
        audio_doc = audio_service.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return jsonify({
                "status": "error",
                "message": "Áudio não encontrado"
            }), 404
        
        # Remove arquivos físicos
        audio_service.cleanup_temp_files(upload_id)
        
        # Remove do banco de dados
        audio_service.audio_model.delete_one({"upload_id": upload_id})
        
        return jsonify({
            "status": "success",
            "message": "Áudio deletado com sucesso"
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao deletar áudio: {str(e)}")
        return jsonify({
            "status": "error",
            "message": f"Erro ao deletar áudio: {str(e)}"
        }), 500
