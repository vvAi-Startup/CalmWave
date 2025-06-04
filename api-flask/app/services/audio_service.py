import os
import uuid
import requests
from flask import current_app, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from app.models import AudioModel # Corrected import path

class AudioService:
    def __init__(self, db_instance): # Accept db_instance
        self.audio_model = AudioModel(db_instance) # Pass db_instance to AudioModel
        self.upload_folder = current_app.config['UPLOAD_FOLDER']
        self.temp_wav_folder = current_app.config['TEMP_WAV_FOLDER']
        self.processed_folder = current_app.config['PROCESSED_FOLDER'] # Added for consistency if used later
        self.base_url = current_app.config['BASE_URL']

    def _handle_error(self, upload_id, status, message, http_status):
        self.audio_model.update_one({"upload_id": upload_id}, {
            "$set": {
                "status": status,
                "updated_at": datetime.utcnow(),
                "error_message": message,
            }
        })
        current_app.logger.error(f"[{upload_id}] {message}")
        return jsonify({"error": message}), http_status

    def handle_audio_upload(self, file_storage):
        if not file_storage:
            return self._handle_error(None, "upload_failed", "Nenhum arquivo enviado", 400)

        original_filename = secure_filename(file_storage.filename)
        if original_filename == '':
            return self._handle_error(None, "upload_failed", "Nome de arquivo inválido", 400)

        upload_id = str(uuid.uuid4())
        temp_wav_filename = f"{upload_id}.wav"
        temp_wav_path = os.path.join(self.temp_wav_folder, temp_wav_filename)

        try:
            # Salvar arquivo temporário
            file_storage.save(temp_wav_path)

            # Aqui você pode fazer a conversão para WAV se necessário
            # Exemplo:
            # AudioProcessor.convert_to_wav(temp_wav_path)

            # Salvar metadata no banco
            self.audio_model.insert_one({
                "upload_id": upload_id,
                "original_filename": original_filename,
                "status": "uploaded",
                "uploaded_at": datetime.utcnow(),
                "temp_wav_path": temp_wav_path,
            })

            return jsonify({"upload_id": upload_id}), 201
        except Exception as e:
            return self._handle_error(upload_id, "upload_failed", f"Erro ao salvar arquivo: {str(e)}", 500)

    def send_to_denoise_service(self, upload_id):
        audio_doc = self.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return self._handle_error(upload_id, "not_found", "Áudio não encontrado", 404)

        temp_wav_path = audio_doc.get("temp_wav_path")
        if not temp_wav_path or not os.path.exists(temp_wav_path):
            return self._handle_error(upload_id, "file_missing", "Arquivo WAV temporário não encontrado", 404)

        try:
            with open(temp_wav_path, "rb") as f:
                files = {"file": (os.path.basename(temp_wav_path), f, "audio/wav")}
                response = requests.post(
                    current_app.config['DENOISE_SERVER'], # Corrected config key
                    files=files,
                    timeout=60  # Timeout reduzido para evitar travamento
                )
            response.raise_for_status()

            self.audio_model.update_one({"upload_id": upload_id}, {"$set": {"status": "denoise_sent", "updated_at": datetime.utcnow()}})
            return jsonify({"message": "Arquivo enviado para denoise com sucesso"}), 200
        except requests.exceptions.Timeout:
            return self._handle_error(upload_id, "denoise_timeout", "Timeout ao enviar para denoise", 504)
        except Exception as e:
            return self._handle_error(upload_id, "denoise_failed", f"Erro ao enviar para denoise: {str(e)}", 500)

    def handle_clear_audio_callback(self, data):
        upload_id = data.get("upload_id")
        if not upload_id:
            return jsonify({"error": "upload_id não fornecido"}), 400

        audio_doc = self.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return jsonify({"error": "upload_id não encontrado"}), 404

        original_filename = audio_doc.get("original_filename", "audio.wav")
        base_name, ext = os.path.splitext(original_filename)
        ext = ext if ext.lower() in ['.wav', '.mp3', '.m4a'] else '.wav'
        unique_filename = f"denoised_{upload_id}_{uuid.uuid4().hex}{ext}"
        final_denoise_path = os.path.join(self.processed_folder, unique_filename) # Save to processed_folder

        try:
            # Salvar arquivo denoised recebido em 'file' do callback
            file_storage = data.get("file")
            if not file_storage:
                return jsonify({"error": "Arquivo denoised não encontrado no callback"}), 400

            # Se 'file_storage' for FileStorage, salvar diretamente:
            file_storage.save(final_denoise_path)

            # Atualizar Mongo com caminho final e status
            self.audio_model.update_one({"upload_id": upload_id}, {
                "$set": {
                    "final_denoise_path": final_denoise_path,
                    "status": "denoise_completed",
                    "updated_at": datetime.utcnow()
                }
            })
            current_app.logger.info(f"[{upload_id}] Callback de denoise finalizado com sucesso")

            return jsonify({"message": "Callback processado com sucesso"}), 200
        except Exception as e:
            return self._handle_error(upload_id, "callback_failed", f"Erro no callback: {str(e)}", 500)

    def get_audio_urls(self):
        audios = self.audio_model.find({})
        result = []
        for audio in audios:
            upload_id = audio.get("upload_id")
            original_filename = audio.get("original_filename", "unknown.wav")
            denoise_path = audio.get("final_denoise_path")
            url = None
            if denoise_path and os.path.exists(denoise_path):
                url = f"{self.base_url}/processed/{os.path.basename(denoise_path)}" # Serve from processed endpoint
            result.append({
                "upload_id": upload_id,
                "original_filename": original_filename,
                "denoised_url": url,
                "status": audio.get("status"),
            })
        return jsonify(result), 200
