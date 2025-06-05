import os
import uuid
import time
import requests
from flask import current_app, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from datetime import datetime
from app.models import AudioModel
from app.extensions import logger
 
class AudioService:
    def __init__(self, db_instance):
        self.db = db_instance
        self.audios_collection = self.db['audios']
        self.audio_model = AudioModel(self.db)
        self.ensure_directories()
 
    def ensure_directories(self):
        """Garante que os diretórios necessários existam."""
        os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)
        os.makedirs(current_app.config['PROCESSED_FOLDER'], exist_ok=True)
        os.makedirs(current_app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), exist_ok=True)
 
    def _handle_error(self, upload_id, status, message, http_status_code):
        if upload_id:
            update_payload = {
                "status": status,
                "error_message": message,
                "last_updated_at": time.time()
            }
            try:
                self.audio_model.update_one(
                    {"upload_id": upload_id},
                    {"$set": update_payload}
                )
            except Exception as e:
                logger.error(f"Erro ao atualizar status de erro: {str(e)}")
        logger.error(f"[{upload_id if upload_id else 'N/A'}] {message}")
        return {"error": message}, http_status_code
 
    def handle_audio_upload(self, file_storage):
        upload_id = None
        if not file_storage:
            return self._handle_error(upload_id, "upload_failed", "Nenhum arquivo enviado", 400)
 
        original_filename = secure_filename(file_storage.filename)
        if original_filename == '':
            return self._handle_error(upload_id, "upload_failed", "Nome de arquivo inválido", 400)
 
        upload_id = str(uuid.uuid4())
        temp_wav_filename = f"{upload_id}.wav"
        temp_wav_path = os.path.join(current_app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), temp_wav_filename)
 
        try:
            file_storage.save(temp_wav_path)
 
            audio_doc_id = self.audio_model.create({
                "upload_id": upload_id,
                "original_filename": original_filename,
                "status": "uploaded",
                "uploaded_at": datetime.utcnow(),
                "temp_wav_path": temp_wav_path,
            })
            if not audio_doc_id:
                return self._handle_error(upload_id, "upload_failed", "Falha ao registrar metadados do áudio no banco.", 500)
 
            logger.info(f"[{upload_id}] Arquivo salvo temporariamente e metadados registrados. Enviando para denoise.")
 
            # Chamar o serviço de denoise
            denoise_response, denoise_status_code = self.send_to_denoise_service(upload_id)
 
            if denoise_status_code >= 400:
                return denoise_response, denoise_status_code
 
            return {
                "upload_id": upload_id,
                "message": "Upload bem-sucedido e arquivo enviado para processamento.",
                "denoise_status": denoise_response.get("message", "Enviado para denoise com sucesso.")
            }, 200
 
        except Exception as e:
            logger.error(f"Erro geral em handle_audio_upload para upload_id {upload_id or 'N/A'}: {str(e)}", exc_info=True)
            return self._handle_error(upload_id, "upload_failed", f"Erro durante o upload inicial do arquivo: {str(e)}", 500)
 
    def send_to_denoise_service(self, upload_id):
        audio_doc = self.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return self._handle_error(upload_id, "not_found", "Áudio não encontrado", 404)
 
        temp_wav_path = audio_doc.get("temp_wav_path")
        if not temp_wav_path or not os.path.exists(temp_wav_path):
            return self._handle_error(upload_id, "file_missing", "Arquivo WAV temporário não encontrado", 404)
 
        try:
            filename = f"final_processed_session_{upload_id}.wav"
           
            with open(temp_wav_path, "rb") as f:
                files = {
                    "audio_file": (filename, f, "audio/wav")
                }
               
                params = {
                    "intensity": 1.0,
                    "session_id": upload_id,
                    "user_id": "system",
                    "filename": filename
                }
               
                response = requests.post(
                    f"{current_app.config.get('DENOISE_SERVER', 'http://localhost:8000')}/audio/denoise",
                    files=files,
                    params=params,
                    headers={
                        "Accept": "application/json",
                        "Content-Type": "multipart/form-data"
                    },
                    timeout=current_app.config.get('DENOISE_TIMEOUT', 300)
                )
               
                logger.debug(f"""
                === DEBUG DA REQUISIÇÃO ===
                URL: {response.url}
                Headers: {response.request.headers}
                Query Params: {params}
                Content-Type do arquivo: audio/wav
                Nome do arquivo: {filename}
                Intensidade: {params['intensity']}
                Session ID: {upload_id}
                Tamanho do arquivo enviado: {os.path.getsize(temp_wav_path)} bytes
                === FIM DO DEBUG ===
                """)
               
            response.raise_for_status()
 
            try:
                self.audio_model.update_one(
                    {"upload_id": upload_id},
                    {"$set": {
                        "status": "denoise_sent",
                        "denoise_requested_at": datetime.utcnow()
                    }}
                )
            except Exception as e:
                logger.error(f"Erro ao atualizar status para denoise_sent: {str(e)}")
           
            return {"message": "Arquivo enviado para denoise com sucesso", "upload_id": upload_id}, 200
           
        except requests.exceptions.Timeout:
            return self._handle_error(upload_id, "denoise_timeout", "Timeout ao enviar para denoise", 504)
        except requests.exceptions.RequestException as e:
            error_msg = f"Erro ao enviar para denoise: {str(e)}"
            if hasattr(e.response, 'text'):
                error_msg += f" - Resposta: {e.response.text}"
            return self._handle_error(upload_id, "denoise_failed", error_msg, 500)
        except Exception as e:
            return self._handle_error(upload_id, "denoise_failed", f"Erro ao enviar para denoise: {str(e)}", 500)
 
    def send_to_denoising(self, wav_path, upload_id, original_filename):
        """Envia o arquivo WAV para o serviço de denoising."""
        try:
            denoise_server = current_app.config.get('DENOISE_SERVER', 'http://localhost:8000')
           
            with open(wav_path, 'rb') as audio_file:
                files = {
                    'audio_file': (original_filename, audio_file, 'audio/wav')
                }
                params = {
                    'intensity': 1.0,
                    'session_id': upload_id or str(uuid.uuid4()),
                    'user_id': 'system',
                    'filename': original_filename,
                }
               
                response = requests.post(
                    f"{denoise_server}/audio/denoise",
                    files=files,
                    params=params,
                )
               
                if response.status_code == 200:
                    return {
                        "status": "success",
                        "message": "Arquivo enviado para processamento",
                        "upload_id": upload_id
                    }
                else:
                    return {
                        "status": "error",
                        "message": f"Erro no serviço de denoising: {response.text}"
                    }
                   
        except requests.exceptions.Timeout:
            return {
                "status": "error",
                "message": "Timeout ao enviar para o serviço de denoising"
            }
        except Exception as e:
            logger.error(f"Erro ao enviar para denoising: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
 
    def handle_clear_audio_callback(self, data):
        upload_id = data.get("upload_id")
        file_storage = data.get("file")
 
        if not upload_id:
            return {"error": "upload_id não fornecido"}, 400
 
        audio_doc = self.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return {"error": "upload_id não encontrado"}, 404
 
        original_filename = audio_doc.get("original_filename", "audio.wav")
        base_name, ext = os.path.splitext(original_filename)
        ext = ext if ext.lower() in ['.wav', '.mp3', '.m4a'] else '.wav'
        unique_filename = f"denoised_{upload_id}_{uuid.uuid4().hex}{ext}"
        final_denoise_path = os.path.join(
            current_app.config['PROCESSED_FOLDER'], unique_filename)
 
        try:
            file_storage = data.get("file")
            if not file_storage:
                return {"error": "Arquivo denoised não encontrado no callback"}, 400
 
            file_storage.save(final_denoise_path)
 
            try:
                self.audio_model.update_one(
                    {"upload_id": upload_id},
                    {"$set": {
                        "processed_path": final_denoise_path,
                        "final_denoise_path": final_denoise_path,
                        "status": "processed",
                        "processed_at": datetime.utcnow(),
                        "processed_filename": unique_filename
                    }}
                )
            except Exception as e:
                logger.error(f"Erro ao atualizar metadados do callback: {str(e)}")
 
            logger.info(f"[{upload_id}] Callback de denoise finalizado com sucesso")
 
            return {"message": "Callback processado com sucesso", "upload_id": upload_id}, 200
        except Exception as e:
            return self._handle_error(upload_id, "callback_failed", f"Erro no callback: {str(e)}", 500)
 
    def get_audio_urls(self):
        audios = self.audio_model.find_all({})
        result = []
        for audio in audios:
            upload_id = audio.get("upload_id")
            original_filename = audio.get("original_filename", "unknown.wav")
            denoise_path = audio.get("final_denoise_path")
            url = None
            if denoise_path and os.path.exists(denoise_path):
                url = f"{current_app.config.get('BASE_URL', 'http://localhost:5000')}/processed/{os.path.basename(denoise_path)}"
            result.append({
                "upload_id": upload_id,
                "original_filename": original_filename,
                "denoised_url": url,
                "status": audio.get("status"),
            })
           
        return result, 200
 
    def save_uploaded_audio(self, audio_file, upload_id):
        try:
            filename = secure_filename(audio_file.filename)
            if not filename:
                filename = f"audio_{upload_id}.m4a"
           
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            audio_file.save(file_path)
           
            self.audio_model.create({
                "upload_id": upload_id,
                "original_filename": filename,
                "content_type": audio_file.content_type,
                "saved_m4a_path": file_path,
                "status": "uploaded",
                "message": "Arquivo original salvo com sucesso",
                "created_at": time.time(),
                "last_updated_at": time.time()
            })
           
            return file_path
           
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo original: {str(e)}")
            return None
 
    def convert_to_wav(self, input_path, upload_id):
        try:
            output_filename = f"{upload_id}_temp.wav"
            output_path = os.path.join(current_app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), output_filename)
           
            os.system(f'ffmpeg -i {input_path} {output_path}')
           
            if not os.path.exists(output_path):
                return {"success": False, "message": "Falha na conversão para WAV"}
           
            return {
                "success": True,
                "output_path": output_path,
                "message": "Conversão para WAV realizada com sucesso"
            }
           
        except Exception as e:
            logger.error(f"Erro na conversão para WAV: {str(e)}")
            return {"success": False, "message": str(e)}
 
    def save_processed_audio(self, audio_data, filename):
        try:
            file_path = os.path.join(current_app.config['PROCESSED_FOLDER'], filename)
           
            with open(file_path, 'wb') as f:
                f.write(audio_data)
           
            return file_path
           
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo processado: {str(e)}")
            return None
 
    def save_audio_metadata(self, metadata):
        try:
            self.audios_collection.insert_one(metadata)
        except Exception as e:
            logger.error(f"Erro ao salvar metadados: {str(e)}")
 
    def update_audio_metadata(self, upload_id, update_data):
        try:
            update_data['last_updated_at'] = time.time()
            self.audio_model.update_one(
                {"upload_id": upload_id},
                {"$set": update_data}
            )
            return True
        except Exception as e:
            logger.error(f"Erro ao atualizar metadados: {str(e)}")
            return False
 
    def cleanup_temp_files(self, upload_id):
        try:
            audio_data = self.audio_model.find_one({"upload_id": upload_id})
            if not audio_data:
                return
           
            if 'saved_m4a_path' in audio_data and os.path.exists(audio_data['saved_m4a_path']):
                os.remove(audio_data['saved_m4a_path'])
           
            temp_wav = os.path.join(current_app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), f"{upload_id}_temp.wav")
            if os.path.exists(temp_wav):
                os.remove(temp_wav)
               
        except Exception as e:
            logger.error(f"Erro ao limpar arquivos temporários: {str(e)}")
 
    def list_processed_audios(self, base_url):
        try:
            audios = self.audio_model.find_all({"status": "processed"})
            result = []
           
            for audio in audios:
                if 'processed_path' in audio:
                    filename = os.path.basename(audio['processed_path'])
                    result.append({
                        "upload_id": audio['upload_id'],
                        "filename": filename,
                        "original_filename": audio.get('original_filename', ''),
                        "created_at": audio.get('created_at', ''),
                        "processed_at": audio.get('processed_at', ''),
                        "url": f"{base_url}processed/{filename}"
                    })
           
            return result
           
        except Exception as e:
            logger.error(f"Erro ao listar áudios processados: {str(e)}")
            return []
 
    def serve_audio_file(self, filename):
        try:
            return send_from_directory(
                current_app.config['PROCESSED_FOLDER'],
                filename,
                as_attachment=False
            )
        except Exception as e:
            logger.error(f"Erro ao servir arquivo {filename}: {str(e)}")
            raise