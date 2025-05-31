from flask import Blueprint, request, jsonify, send_from_directory, current_app
from app.services.audio_service import AudioService
from app.schemas.audio_schema import AudioProcessResponseSchema, AudioListSchema
from app.extensions import logger
import os

# Crie um Blueprint para agrupar as rotas relacionadas a áudio
audio_bp = Blueprint('audio', __name__, url_prefix='/')

# Instancie o serviço de áudio
audio_service = None # Será inicializado em register_resources

def register_resources(app):
    global audio_service
    # Passe o contexto da aplicação para o AudioService para que ele possa acessar app.config
    with app.app_context():
        audio_service = AudioService()

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
                logger.error("Nenhum arquivo de áudio enviado na requisição /upload.")
                return jsonify({
                    "error": "Nenhum arquivo de áudio enviado",
                    "status": "error",
                    "message": "Por favor, envie um arquivo de áudio válido"
                }), 400

            audio_file = request.files['audio']
            
            response_data, status_code = audio_service.handle_audio_upload(audio_file)
            return jsonify(response_data), status_code

        except Exception as e:
            logger.error(f"Erro inesperado no endpoint /upload: {str(e)}", exc_info=True)
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
                logger.error(f"ID {upload_id_from_form}: Nenhum arquivo de áudio enviado na requisição /clear_audio.")
                return jsonify({
                    "error": "Nenhum arquivo de áudio enviado",
                    "status": "error",
                    "message": "Por favor, envie um arquivo de áudio válido"
                }), 400

            audio_file = request.files['audio']

            response_data, status_code = audio_service.handle_clear_audio_callback(
                audio_file, upload_id_from_form, original_filename_from_form, request.url_root
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
            audios = audio_service.get_all_audios_simplified()
            return jsonify({
                "status": "success",
                "message": "Áudios listados com sucesso" if audios else "Nenhum áudio encontrado",
                "data": audios
            }), 200

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
            file_path = audio_service.get_audio_file(filename)
            if file_path:
                return send_from_directory(current_app.config['PROCESSED_FOLDER'], filename)
            else:
                logger.warning(f"Arquivo de áudio não encontrado para servir: {filename}")
                return jsonify({
                    "status": "error",
                    "message": "Arquivo de áudio não encontrado",
                    "error": f"File not found: {filename}"
                }), 404
        except Exception as e:
            logger.error(f"Erro ao servir áudio {filename}: {str(e)}", exc_info=True)
            return jsonify({
                "status": "error",
                "message": "Erro ao servir arquivo de áudio",
                "error": str(e)
            }), 500