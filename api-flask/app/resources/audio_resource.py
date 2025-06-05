from flask import Blueprint, request, jsonify, send_from_directory, current_app
import os
import uuid
import time
from app.services.audio_service import AudioService
from app.extensions import logger

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
    try:
        if 'audio' not in request.files:
            logger.error("Nenhum arquivo de áudio enviado na requisição /upload.")
            return jsonify({
                "error": "Nenhum arquivo de áudio enviado",
                "status": "error",
                "message": "Por favor, envie um arquivo de áudio válido"
            }), 400

        audio_file = request.files['audio']
        filename = audio_file.filename
        content_type = audio_file.content_type
        upload_id = str(uuid.uuid4())

        logger.info(f"ID {upload_id}: Iniciando upload do arquivo: {filename}")

        # Usa a instância do serviço de áudio do app
        audio_service = current_app.audio_service

        # Salva o arquivo original
        saved_m4a_path = audio_service.save_uploaded_audio(audio_file, upload_id)
        if not saved_m4a_path:
            logger.error(f"ID {upload_id}: Falha ao salvar o arquivo original.")
            return jsonify({
                "error": "Falha ao salvar o arquivo",
                "status": "error",
                "message": "Não foi possível salvar o arquivo de áudio"
            }), 500

        # Converte para WAV
        processing_result = audio_service.convert_to_wav(saved_m4a_path, upload_id)
        if not processing_result['success']:
            logger.error(f"ID {upload_id}: Falha na conversão para WAV: {processing_result['message']}")
            return jsonify({
                "error": "Falha na conversão",
                "status": "error",
                "message": processing_result['message']
            }), 500

        # Envia para denoising
        denoising_result = audio_service.send_to_denoising(
            processing_result['output_path'],
            upload_id,
            filename
        )

        if denoising_result['status'] == 'error':
            logger.error(f"ID {upload_id}: Falha no envio para denoising: {denoising_result['message']}")
            return jsonify({
                "error": "Falha no processamento",
                "status": "error",
                "message": denoising_result['message']
            }), 500

        return jsonify({
            "status": "success",
            "message": "Arquivo enviado para processamento",
            "upload_id": upload_id,
            "processed_audio_url": denoising_result['processed_audio_url']
        }), 200

    except Exception as e:
        logger.error(f"Erro no upload de áudio: {str(e)}")
        return jsonify({
            "error": "Erro interno",
            "status": "error",
            "message": str(e)
        }), 500

@audio_bp.route('/clear_audio', methods=['POST'])
def clear_audio():
    """Endpoint para receber o áudio processado do serviço de denoising."""
    upload_id = DEFAULT_SESSION
    try:
        upload_id_from_form = request.form.get('upload_id')
        upload_id = upload_id_from_form or str(uuid.uuid4())

        if not upload_id_from_form:
            logger.warning(f"Requisição /clear_audio recebida sem upload_id específico. Usando gerado: {upload_id}")

        logger.info(f"ID {upload_id}: Requisição /clear_audio recebida.")

        if 'audio' not in request.files:
            logger.error(f"ID {upload_id}: Nenhum arquivo de áudio enviado na requisição /clear_audio.")
            return jsonify({
                "error": "Nenhum arquivo de áudio enviado",
                "status": "error",
                "message": "Por favor, envie um arquivo de áudio válido"
            }), 400

        audio_file = request.files['audio']
        original_filename = request.form.get('filename', DEFAULT_FILENAME)
        unique_filename = f"{upload_id}_{original_filename}"

        # Usa a instância do serviço de áudio do app
        audio_service = current_app.audio_service

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
        audio_service.update_audio_metadata(upload_id, {
            'status': 'processed',
            'processed_path': saved_processed_path,
            'processed_at': time.time()
        })

        # Limpa arquivos temporários
        audio_service.cleanup_temp_files(upload_id)

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

@audio_bp.route('/audios/list', methods=['GET'])
def list_audios():
    """Endpoint para listar áudios processados."""
    try:
        # Usa a instância do serviço de áudio do app
        audio_service = current_app.audio_service
        audio_files = audio_service.list_processed_audios(request.url_root)

        return jsonify({
            "status": "success",
            "message": "Áudios listados com sucesso" if audio_files else "Nenhum áudio encontrado",
            "data": audio_files
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
