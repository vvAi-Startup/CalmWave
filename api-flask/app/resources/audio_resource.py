from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.services.audio_service import AudioService
from app.schemas.audio_schema import AudioProcessResponseSchema, AudioListSchema
from app.extensions import logger  # Manter apenas logger aqui
import os

audio_bp = Blueprint('audio', __name__, url_prefix='/')

# Declarar as instâncias dos serviços globalmente, mas elas serão preenchidas
# no app/__init__.py APÓS a inicialização do DB.
# Isso requer que as funções do blueprint as acessem via current_app.
# Ou, se preferir, você pode passá-las como argumento para as funções do blueprint
# se estiver usando uma abordagem de fábrica de blueprints mais avançada.
# Para simplicidade e para resolver o problema atual, vamos injetar via current_app.
# audio_service = None # REMOVA ESTA LINHA

# A função register_resources será removida, pois a inicialização será centralizada.
# As rotas serão registradas diretamente no blueprint.


@audio_bp.route('/health', methods=['GET'])
def health_check():
    """
    Endpoint para verificar se a API está online.
    """
    return jsonify({'status': 'ok', 'message': 'API is running!'}), 200


@audio_bp.route('/upload', methods=['POST'])
def upload_audio():
    """
    Endpoint para upload de áudio.
    Recebe um arquivo de áudio, salva, converte para WAV (se necessário)
    e envia para um serviço externo de denoising.
    """
    try:
        if 'audio' not in request.files:
            logger.error(
                "Nenhum arquivo de áudio enviado na requisição /upload.")
            return jsonify({
                "error": "Nenhum arquivo de áudio enviado",
                "status": "error",
                "message": "Por favor, envie um arquivo de áudio válido"
            }), 400

        audio_file = request.files['audio']

        # Acessa o serviço de áudio da instância do Flask app
        audio_service = current_app.audio_service

        response_data, status_code = audio_service.handle_audio_upload(
            audio_file)
        return jsonify(response_data), status_code

    except Exception as e:
        logger.error(
            f"Erro inesperado no endpoint /upload: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Erro interno do servidor",
            "status": "error",
            "message": "Falha ao processar o upload do áudio"
        }), 500


@audio_bp.route('/clear_audio', methods=['POST'])
def clear_audio():
    """
    Endpoint para receber um arquivo de áudio processado do microsserviço de denoising
    e salvá-lo.
    """
    try:
        upload_id_from_form = request.form.get('upload_id')
        original_filename_from_form = request.form.get('filename')

        if 'audio' not in request.files:
            logger.error(
                f"ID {upload_id_from_form}: Nenhum arquivo de áudio enviado na requisição /clear_audio.")
            return jsonify({
                "error": "Nenhum arquivo de áudio enviado",
                "status": "error",
                "message": "Por favor, envie um arquivo de áudio válido"
            }), 400

        audio_file = request.files['audio']

        # Acessa o serviço de áudio da instância do Flask app
        audio_service = current_app.audio_service
        # Prepara os dados para o método de serviço
        service_data = {
            "upload_id": upload_id_from_form,
            "file": audio_file
            # original_filename_from_form e request.url_root não são usados pela lógica atual do serviço handle_clear_audio_callback
        }
        response_data, status_code = audio_service.handle_clear_audio_callback(
            service_data
        )
        return jsonify(response_data), status_code

    except Exception as e:
        logger.error(f"Erro no endpoint /clear_audio: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Erro interno do servidor",
            "status": "error",
            "message": "Falha ao processar o áudio limpo"
        }), 500


@audio_bp.route('/audios/list', methods=['GET'])
def list_audios_simplified():
    """
    Endpoint simplificado para listar áudios processados.
    """
    try:
        # Acessa o serviço de áudio da instância do Flask app
        audio_service = current_app.audio_service
        # Corrigido nome do método e desempacotamento
        audios_list, status_code = audio_service.get_audio_urls()

        if status_code == 200:
            return jsonify({
                "status": "success",
                "message": "Áudios listados com sucesso" if audios_list else "Nenhum áudio encontrado",
                "data": audios_list
            }), 200
        else:
            # Se o serviço retornar um erro (improvável para este método específico como está agora)
            return jsonify(audios_list or {"error": "Falha ao listar áudios"}), status_code

    except Exception as e:
        logger.error(f"Erro ao listar áudios: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Erro ao listar áudios",
            "error": str(e),
            "data": []
        }), 500


@audio_bp.route('/processed/<path:filename>')
def serve_audio(filename):
    """
    Endpoint para servir arquivos de áudio diretamente do diretório 'processed'.
    """
    try:
        # Acessa o serviço de áudio da instância do Flask app
        audio_service = current_app.audio_service
        file_path = audio_service.get_audio_file(filename)
        if file_path:
            return send_from_directory(current_app.config['PROCESSED_FOLDER'], filename)
        else:
            logger.warning(
                f"Arquivo de áudio não encontrado para servir: {filename}")
            return jsonify({
                "status": "error",
                "message": "Arquivo de áudio não encontrado",
                "error": f"File not found: {filename}"
            }), 404
    except Exception as e:
        logger.error(
            f"Erro ao servir áudio {filename}: {str(e)}", exc_info=True)
        return jsonify({
            "status": "error",
            "message": "Erro ao servir arquivo de áudio",
            "error": str(e)
        }), 500
