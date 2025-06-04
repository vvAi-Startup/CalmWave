import os
import uuid
import requests
from flask import current_app, jsonify
from werkzeug.utils import secure_filename
from datetime import datetime
from app.models import AudioModel  # Corrected import path


class AudioService:
    def __init__(self, db_instance):  # Accept db_instance
        # Pass db_instance to AudioModel
        self.audio_model = AudioModel(db_instance)
        self.upload_folder = current_app.config['UPLOAD_FOLDER']
        self.temp_wav_folder = current_app.config['TEMP_WAV_FOLDER']
        # Added for consistency if used later
        self.processed_folder = current_app.config['PROCESSED_FOLDER']
        self.base_url = current_app.config['BASE_URL']

    def _handle_error(self, upload_id, status, message, http_status_code):
        if upload_id:
            update_payload = {
                "status": status,
                "error_message": message,
                # last_updated_at será definido por AudioModel.update_one

            }
            self.audio_model.update_one(
                {"upload_id": upload_id},
                update_payload,
                upsert=False  # Não criar um novo documento se não existir
            )
        current_app.logger.error(
            f"[{upload_id if upload_id else 'N/A'}] {message}")
        # Retorna dict e status_code
        return {"error": message}, http_status_code

    def handle_audio_upload(self, file_storage):
        upload_id = None  # Inicializa upload_id para uso no bloco except
        if not file_storage:
            return self._handle_error(upload_id, "upload_failed", "Nenhum arquivo enviado", 400)

        original_filename = secure_filename(file_storage.filename)
        if original_filename == '':
            return self._handle_error(upload_id, "upload_failed", "Nome de arquivo inválido", 400)

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
            audio_doc_id = self.audio_model.create({  # Corrigido de insert_one para create
                "upload_id": upload_id,
                "original_filename": original_filename,
                "status": "uploaded",
                "uploaded_at": datetime.utcnow(),
                "temp_wav_path": temp_wav_path,
            })
            if not audio_doc_id:
                # O método create deve idealmente levantar uma exceção em caso de falha
                return self._handle_error(upload_id, "upload_failed", "Falha ao registrar metadados do áudio no banco.", 500)

            current_app.logger.info(f"[{upload_id}] Arquivo salvo temporariamente e metadados registrados. Enviando para denoise.")

            # Chamar o serviço de denoise
            denoise_response, denoise_status_code = self.send_to_denoise_service(upload_id)

            # Se o envio para denoise falhou, _handle_error já atualizou o status no DB
            # e denoise_response conterá o erro.
            if denoise_status_code >= 400:
                # send_to_denoise_service já logou o erro e atualizou o DB.
                # A resposta de handle_audio_upload reflete o resultado do envio para denoise.
                return denoise_response, denoise_status_code

            # Se chegou aqui, o envio para denoise foi bem-sucedido (status 200)
            # O status no DB foi atualizado para "denoise_sent" por send_to_denoise_service.
            return {
                "upload_id": upload_id,
                "message": "Upload bem-sucedido e arquivo enviado para processamento.",
                "denoise_status": denoise_response.get("message", "Enviado para denoise com sucesso.")
            }, 200 # HTTP 200 OK, pois a ação principal (upload + dispatch) foi concluída.
        except Exception as e:
            # Captura erros ANTES da chamada a send_to_denoise_service ou se audio_doc_id não foi criado.
            current_app.logger.error(f"Erro geral em handle_audio_upload para upload_id {upload_id or 'N/A'}: {str(e)}", exc_info=True)
            # Se upload_id foi gerado, _handle_error tentará atualizar o DB.
            return self._handle_error(upload_id, "upload_failed", f"Erro durante o upload inicial do arquivo: {str(e)}", 500)

    def send_to_denoise_service(self, upload_id):
        audio_doc = self.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return self._handle_error(upload_id, "not_found", "Áudio não encontrado", 404)

        temp_wav_path = audio_doc.get("temp_wav_path")
        if not temp_wav_path or not os.path.exists(temp_wav_path):
            return self._handle_error(upload_id, "file_missing", "Arquivo WAV temporário não encontrado", 404)

        try:
            with open(temp_wav_path, "rb") as f:
                files = {"file": (os.path.basename(
                    temp_wav_path), f, "audio/wav")}
                response = requests.post(
                    # Corrected config key
                    current_app.config['DENOISE_SERVER'],
                    files=files,
                    timeout=60  # Timeout reduzido para evitar travamento
                )
            response.raise_for_status()

            self.audio_model.update_one(
                {"upload_id": upload_id},
                {"status": "denoise_sent"}  # updated_at é tratado pelo model
            )
            # Retorna dict
            return {"message": "Arquivo enviado para denoise com sucesso", "upload_id": upload_id}, 200
        except requests.exceptions.Timeout:
            return self._handle_error(upload_id, "denoise_timeout", "Timeout ao enviar para denoise", 504)
        except Exception as e:
            return self._handle_error(upload_id, "denoise_failed", f"Erro ao enviar para denoise: {str(e)}", 500)

    def handle_clear_audio_callback(self, data):
        upload_id = data.get("upload_id")
        file_storage = data.get("file")  # Espera FileStorage aqui

        if not upload_id:
            return {"error": "upload_id não fornecido"}, 400  # Retorna dict

        audio_doc = self.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return {"error": "upload_id não encontrado"}, 404  # Retorna dict

        original_filename = audio_doc.get("original_filename", "audio.wav")
        base_name, ext = os.path.splitext(original_filename)
        ext = ext if ext.lower() in ['.wav', '.mp3', '.m4a'] else '.wav'
        unique_filename = f"denoised_{upload_id}_{uuid.uuid4().hex}{ext}"
        final_denoise_path = os.path.join(
            self.processed_folder, unique_filename)  # Save to processed_folder

        try:
            # Salvar arquivo denoised recebido em 'file' do callback
            file_storage = data.get("file")
            if not file_storage:
                # Retorna dict
                return {"error": "Arquivo denoised não encontrado no callback"}, 400

            # Se 'file_storage' for FileStorage, salvar diretamente:
            file_storage.save(final_denoise_path)

            # Atualizar Mongo com caminho final e status
            self.audio_model.update_one({"upload_id": upload_id}, {
                "final_denoise_path": final_denoise_path,
                "status": "denoise_completed"
                # updated_at é tratado pelo model
            })
            current_app.logger.info(
                f"[{upload_id}] Callback de denoise finalizado com sucesso")

            return {"message": "Callback processado com sucesso", "upload_id": upload_id}, 200 # Retorna dict
        except Exception as e:
            return self._handle_error(upload_id, "callback_failed", f"Erro no callback: {str(e)}", 500)

    def get_audio_urls(self):
        audios = self.audio_model.find_all({}) # Corrigido para find_all
        result = []
        for audio in audios:
            upload_id = audio.get("upload_id")
            original_filename = audio.get("original_filename", "unknown.wav")
            denoise_path = audio.get("final_denoise_path")
            url = None
            if denoise_path and os.path.exists(denoise_path):
                # Serve from processed endpoint
                url = f"{self.base_url}/processed/{os.path.basename(denoise_path)}"
            result.append({
                "upload_id": upload_id,
                "original_filename": original_filename,
                "denoised_url": url,
                "status": audio.get("status"),
            })
            
        return result, 200 # Retorna lista e status_code
