import os
import uuid
import time
import requests
from flask import current_app, jsonify
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
            self.audio_model.update_one(
                {"upload_id": upload_id},
                update_payload,
                upsert=False
            )
        logger.error(f"[{upload_id if upload_id else 'N/A'}] {message}")
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
        temp_wav_path = os.path.join(current_app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), temp_wav_filename)

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

            logger.info(f"[{upload_id}] Arquivo salvo temporariamente e metadados registrados. Enviando para denoise.")

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
            logger.error(f"Erro geral em handle_audio_upload para upload_id {upload_id or 'N/A'}: {str(e)}", exc_info=True)
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
            # Prepara o nome do arquivo no formato esperado pelo serviço
            filename = f"final_processed_session_{upload_id}.wav"
            
            # Abre o arquivo e prepara para envio
            with open(temp_wav_path, "rb") as f:
                # Prepara os dados do formulário
                files = {
                    "file": (filename, f, "audio/wav")
                }
                
                # Parâmetros da query
                params = {
                    "intensity": "1"  # Valor padrão de intensidade
                }
                
                # Faz a requisição para o serviço de denoise
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
                
                # Log para debug
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

            self.audio_model.update_one(
                {"upload_id": upload_id},
                {"status": "denoise_sent"}
            )
            
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
            current_app.config['PROCESSED_FOLDER'], unique_filename)  # Save to processed_folder

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
            logger.info(
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
                url = f"{current_app.config.get('BASE_URL', 'http://localhost:5000')}/processed/{os.path.basename(denoise_path)}"
            result.append({
                "upload_id": upload_id,
                "original_filename": original_filename,
                "denoised_url": url,
                "status": audio.get("status"),
            })
            
        return result, 200 # Retorna lista e status_code

    def save_uploaded_audio(self, audio_file, upload_id):
        """Salva o arquivo de áudio original."""
        try:
            filename = secure_filename(audio_file.filename)
            if not filename:
                filename = f"audio_{upload_id}.m4a"
            
            file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            audio_file.save(file_path)
            
            # Salva metadados iniciais
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
        """Converte o arquivo para formato WAV."""
        try:
            output_filename = f"{upload_id}_temp.wav"
            output_path = os.path.join(current_app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), output_filename)
            
            # Aqui você pode adicionar a lógica de conversão usando ffmpeg ou outra biblioteca
            # Por enquanto, vamos apenas simular a conversão
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

    def send_to_denoising(self, wav_path, upload_id, original_filename):
        """Envia o arquivo WAV para o serviço de denoising."""
        try:
            denoise_server = current_app.config.get('DENOISE_SERVER', 'http://localhost:8000')
            denoise_timeout = current_app.config.get('DENOISE_TIMEOUT', 300)
            
            with open(wav_path, 'rb') as audio_file:
                files = {'audio': audio_file}
                data = {
                    'upload_id': upload_id,
                    'filename': original_filename
                }
                
                response = requests.post(
                    f"{denoise_server}/process",
                    files=files,
                    data=data,
                    timeout=denoise_timeout
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return {
                        "status": "success",
                        "message": "Arquivo enviado para processamento",
                        "processed_audio_url": result.get('processed_audio_url')
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

    def save_processed_audio(self, audio_data, filename):
        """Salva o arquivo de áudio processado."""
        try:
            file_path = os.path.join(current_app.config['PROCESSED_FOLDER'], filename)
            
            with open(file_path, 'wb') as f:
                f.write(audio_data)
            
            return file_path
            
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo processado: {str(e)}")
            return None

    def save_audio_metadata(self, metadata):
        """Salva metadados do áudio no MongoDB."""
        try:
            self.audios_collection.insert_one(metadata)
        except Exception as e:
            logger.error(f"Erro ao salvar metadados: {str(e)}")

    def update_audio_metadata(self, upload_id, update_data):
        """Atualiza os metadados do áudio."""
        try:
            update_data['last_updated_at'] = time.time()
            self.audio_model.update_one(
                {"upload_id": upload_id},
                update_data,
                upsert=False
            )
            return True
        except Exception as e:
            logger.error(f"Erro ao atualizar metadados: {str(e)}")
            return False

    def cleanup_temp_files(self, upload_id):
        """Limpa arquivos temporários."""
        try:
            # Busca os metadados do áudio
            audio_data = self.audio_model.find_one({"upload_id": upload_id})
            if not audio_data:
                return
            
            # Remove arquivos temporários
            if 'saved_m4a_path' in audio_data and os.path.exists(audio_data['saved_m4a_path']):
                os.remove(audio_data['saved_m4a_path'])
            
            temp_wav = os.path.join(current_app.config.get('TEMP_WAV_FOLDER', os.path.join(os.getcwd(), 'temp_wavs')), f"{upload_id}_temp.wav")
            if os.path.exists(temp_wav):
                os.remove(temp_wav)
                
        except Exception as e:
            logger.error(f"Erro ao limpar arquivos temporários: {str(e)}")

    def list_processed_audios(self, base_url):
        """Lista todos os áudios processados."""
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
        """Serve um arquivo de áudio processado."""
        try:
            return send_from_directory(
                current_app.config['PROCESSED_FOLDER'],
                filename,
                as_attachment=False
            )
        except Exception as e:
            logger.error(f"Erro ao servir arquivo {filename}: {str(e)}")
            raise
