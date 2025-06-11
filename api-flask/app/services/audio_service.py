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
 
    def send_to_denoise(self, wav_path, upload_id, original_filename=None):
        """
        Envia o arquivo WAV para o serviço de denoising.
        
        Args:
            wav_path (str): Caminho do arquivo WAV a ser processado
            upload_id (str): ID do upload
            original_filename (str, optional): Nome original do arquivo. Se não fornecido, será gerado um nome baseado no upload_id.
            
        Returns:
            tuple: (response_dict, status_code)
        """
        try:
            # Verifica se o arquivo existe
            if not os.path.exists(wav_path):
                return self._handle_error(upload_id, "file_missing", "Arquivo WAV não encontrado", 404)

            # Gera o nome do arquivo se não fornecido
            if not original_filename:
                original_filename = f"final_processed_session_{upload_id}.wav"

            # Busca informações do áudio no banco
            audio_doc = self.audio_model.find_one({"upload_id": upload_id})
            
            with open(wav_path, "rb") as f:
                files = {
                    "audio_file": (original_filename, f, "audio/wav")
                }
               
                # Valores padrão para os parâmetros
                params = {
                    "intensity": 1.0,
                    "session_id": upload_id or "unknown",
                    "user_id": audio_doc.get("user_id", "guest") if audio_doc else "guest",
                    "filename": original_filename
                }
               
                url = f"{current_app.config.get('DENOISE_SERVER', 'http://localhost:8000')}/audio/denoise"
                
                # Log detalhado da requisição
                logger.debug(f"""
                === DEBUG DA REQUISIÇÃO ===
                URL: {url}
                Headers: {{
                    "Accept": "application/json"
                }}
                Query Params: {params}
                Content-Type do arquivo: audio/wav
                Nome do arquivo: {original_filename}
                Intensidade: {params['intensity']}
                Session ID: {params['session_id']}
                User ID: {params['user_id']}
                Filename: {params['filename']}
                Tamanho do arquivo recebido: {os.path.getsize(wav_path)} bytes
                Arquivo temporário criado: {wav_path}
                === FIM DO DEBUG ===
                """)
               
                # Faz a requisição
                response = requests.post(
                    url,
                    files=files,
                    params=params,
                    headers={
                        "Accept": "application/json"
                    },
                    timeout=current_app.config.get('DENOISE_TIMEOUT', 300)
                )
               
                # Log detalhado da resposta
                logger.debug(f"""
                === DEBUG DA RESPOSTA ===
                Status Code: {response.status_code}
                Headers: {response.headers}
                Response: {response.text}
                URL Final: {response.url}
                Request Headers: {response.request.headers}
                Request Body: {response.request.body[:1000] if response.request.body else 'None'}
                === FIM DO DEBUG ===
                """)

                if response.status_code == 422:
                    error_msg = f"Erro de validação na requisição: {response.text}"
                    logger.error(error_msg)
                    return self._handle_error(upload_id, "validation_error", error_msg, 422)
                
                response.raise_for_status()

                try:
                    # Atualiza o status para denoise_sent
                    self.audio_model.update_one(
                        {"upload_id": upload_id},
                        {"$set": {
                            "status": "denoise_sent",
                            "denoise_requested_at": datetime.utcnow(),
                            "last_updated_at": datetime.utcnow(),
                            "message": "Arquivo enviado para processamento de denoising"
                        }}
                    )
                    logger.info(f"[{upload_id}] Status atualizado para denoise_sent")
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
            denoise_response, denoise_status_code = self.send_to_denoise(temp_wav_path, upload_id, original_filename)
 
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
                # Gera a URL do áudio processado
                processed_url = f"/audio/processed/{unique_filename}"
                
                # Atualiza o status para processed
                self.audio_model.update_one(
                    {"upload_id": upload_id},
                    {"$set": {
                        "processed_path": final_denoise_path,
                        "final_denoise_path": final_denoise_path,
                        "status": "processed",
                        "processed_at": datetime.utcnow(),
                        "processed_filename": unique_filename,
                        "processed_url": processed_url,
                        "last_updated_at": datetime.utcnow(),
                        "message": "Arquivo processado com sucesso"
                    }}
                )
                logger.info(f"[{upload_id}] Status atualizado para processed")
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
        """Lista todos os áudios processados com suas URLs."""
        try:
            audios = self.audio_model.find_all({"status": "processed"})
            
            for audio in audios:
                if audio.get("processed_filename"):
                    # Gera a URL completa do áudio processado
                    audio["processed_url"] = f"{base_url}/audio/processed/{audio['processed_filename']}"
                else:
                    audio["processed_url"] = None
                    
            return audios
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