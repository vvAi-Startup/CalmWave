import os
import uuid
import requests
from datetime import datetime # Importar datetime para timestamps

from app.models import AudioModel
from app.schemas.audio_schema import AudioProcessResponseSchema, DenoiseServiceResponseSchema, AudioListSchema # Corrigir importação redundante e adicionar AudioListSchema
from app.audio_processor import AudioProcessor
from app.extensions import logger
from flask import current_app


class AudioService:
    def __init__(self):
        self.audio_model = AudioModel()
        
        # Acesso às pastas configuradas via current_app.config
        upload_folder = current_app.config['UPLOAD_FOLDER']
        temp_wav_folder = current_app.config.get('TEMP_WAV_FOLDER', os.path.join(
            os.getcwd(), 'temp_wavs')) # Use get() com fallback
        processed_output_folder = current_app.config['PROCESSED_FOLDER']

        # Instancia o AudioProcessor passando os caminhos das pastas
        self.audio_processor = AudioProcessor(
            upload_folder, temp_wav_folder, processed_output_folder)

        self.processed_dir = processed_output_folder # Mantenha esta referência se ainda for usada
        self.denoise_service_url = current_app.config['DENOISE_SERVER']
        
        # Estas chamadas os.makedirs são importantes e podem ser feitas no __init__ do app
        # ou aqui para garantir que as pastas existam quando o serviço é inicializado.
        os.makedirs(self.processed_dir, exist_ok=True)
        os.makedirs(upload_folder, exist_ok=True)
        os.makedirs(temp_wav_folder, exist_ok=True)

    def handle_audio_upload(self, audio_file):
        """
        Lida com o upload inicial de um arquivo de áudio (M4A),
        o converte para WAV e o envia para o serviço de denoising.
        """
        upload_id = str(uuid.uuid4())
        filename = audio_file.filename or f"audio_{upload_id}.m4a"
        content_type = audio_file.content_type or 'audio/unknown'

        logger.info(
            f"Upload recebido. ID: {upload_id}, Nome do Arquivo: {filename}")

        audio_data = audio_file.read()
        if not audio_data:
            logger.error(
                f"Upload ID {upload_id}: Dados de áudio vazios após a leitura do arquivo.")
            return AudioProcessResponseSchema().dump({
                "upload_id": upload_id, "status": "error",
                "message": "Não foi possível ler os dados do arquivo de áudio"
            }), 400

        try:
            # Salva o áudio M4A original
            saved_m4a_path = self.audio_processor.save_final_audio(
                audio_data, upload_id, filename)
            logger.info(f"ID {upload_id}: Áudio M4A salvo em: {saved_m4a_path}")

            # Salva o registro inicial no MongoDB
            self.audio_model.create({
                "upload_id": upload_id,
                "original_filename": filename,
                "content_type": content_type,
                "saved_m4a_path": saved_m4a_path,
                "status": "uploaded",
                "message": "Arquivo recebido e salvo, aguardando conversão para WAV.",
                "created_at": datetime.utcnow(), # Usar datetime.utcnow()
                "last_updated_at": datetime.utcnow(),
            })

            # Converte M4A para WAV
            processing_result = self.audio_processor.process_session(upload_id)
            if processing_result["status"] == "error":
                logger.error(
                    f"ID {upload_id}: Erro ao converter M4A para WAV: {processing_result['message']}")
                self.audio_model.update_one(
                    {"upload_id": upload_id},
                    {"status": "conversion_failed", "message": processing_result.get(
                        'message', "Falha na conversão para WAV"),
                     "last_updated_at": datetime.utcnow()}
                )
                return AudioProcessResponseSchema().dump({
                    "upload_id": upload_id, "status": "error",
                    "message": f"Falha na conversão para WAV: {processing_result.get('message', '')}"
                }), 500

            processed_wav_path_temp = processing_result.get('output_path')
            logger.info(
                f"ID {upload_id}: Áudio convertido para WAV em: {processed_wav_path_temp}")

            if not os.path.exists(processed_wav_path_temp) or os.path.getsize(processed_wav_path_temp) == 0:
                logger.error(
                    f"ID {upload_id}: Arquivo WAV processado está faltando ou vazio.")
                self.audio_model.update_one(
                    {"upload_id": upload_id},
                    {"status": "wav_missing",
                     "message": "Arquivo WAV temporário está faltando ou vazio",
                     "last_updated_at": datetime.utcnow()}
                )
                return AudioProcessResponseSchema().dump({
                    "upload_id": upload_id, "status": "error",
                    "message": "Arquivo de áudio processado está faltando ou vazio"
                }), 500

            self.audio_model.update_one(
                {"upload_id": upload_id},
                {"processed_wav_path": processed_wav_path_temp,
                 "status": "wav_converted",
                 "message": "WAV convertido, enviando para denoising.",
                 "last_updated_at": datetime.utcnow()}
            )

            # Envia o arquivo WAV para o serviço de denoising
            denoise_status = "unknown"
            denoise_message = "Nenhuma mensagem disponível"
            processed_audio_url = None

            try:
                with open(processed_wav_path_temp, 'rb') as audio_file_handle:
                    files_to_send = {
                        'audio_file': (os.path.basename(processed_wav_path_temp), audio_file_handle, 'audio/wav'),
                    }
                    params_to_send = {
                        'intensity': 1.0,
                        'upload_id': upload_id,
                        'filename': filename, # Use o filename original aqui, o serviço pode preferir
                    }
                    logger.debug(
                        f"ID {upload_id}: Enviando para o serviço de denoising - URL: {self.denoise_service_url}")

                    denoise_response = requests.post(
                        self.denoise_service_url,
                        params=params_to_send,
                        files=files_to_send,
                        timeout=300
                    )
                    denoise_response.raise_for_status()

                    denoise_response_json = denoise_response.json()
                    logger.info(
                        f"ID {upload_id}: Resposta do serviço de denoising: {denoise_response_json}")

                    # Valida a resposta do serviço de denoising
                    denoise_response_data = DenoiseServiceResponseSchema().load(denoise_response_json)

                    denoise_service_internal_status = denoise_response_data.get(
                        'status', 'unknown')
                    denoise_service_internal_message = denoise_response_data.get(
                        'message', 'Nenhuma mensagem disponível')

                    if denoise_service_internal_status == 'success':
                        denoise_status = 'denoise_processing_started'
                        denoise_message = "Áudio enviado para processamento de denoising. Aguardando callback."
                        processed_audio_url = denoise_response_data.get('path')
                        if not processed_audio_url:
                            logger.warning(
                                f"ID {upload_id}: Serviço de denoising retornou sucesso, mas sem 'path' para o áudio processado.")
                            denoise_status = "denoise_processing_started_no_path"
                            denoise_message = "Processamento iniciado, mas o caminho do áudio não foi retornado imediatamente"
                    else:
                        denoise_status = 'denoise_processing_failed'
                        denoise_message = f"Feedback do serviço de denoising: {denoise_service_internal_message}"

            except requests.exceptions.JSONDecodeError as json_err:
                logger.error(
                    f"ID {upload_id}: Erro de JSON ao parsear resposta do serviço de denoising: {json_err}. Resposta: {denoise_response.text}")
                denoise_status = "denoise_send_failed"
                denoise_message = f"Resposta inválida do serviço de processamento: {json_err}. Detalhes: {denoise_response.text[:200]}"

            except requests.exceptions.Timeout:
                logger.error(
                    f"ID {upload_id}: Requisição do serviço de denoising excedeu o tempo limite (300s).")
                denoise_status = "denoise_timeout"
                denoise_message = "Tempo limite excedido ao processar o áudio"

            except requests.exceptions.RequestException as req_err:
                error_response_text = req_err.response.text if req_err.response is not None else "N/A"
                logger.error(
                    f"ID {upload_id}: Erro de requisição ao enviar áudio para o serviço de denoising: {req_err}. Resposta: {error_response_text}")
                denoise_status = "denoise_send_failed"
                denoise_message = f"Falha ao enviar áudio para processamento: {req_err}. Detalhes: {error_response_text[:200]}"

            except Exception as e:
                logger.error(
                    f"ID {upload_id}: Erro inesperado durante a chamada do serviço de denoising: {e}", exc_info=True)
                denoise_status = "denoise_send_failed"
                denoise_message = f"Erro inesperado durante o processamento: {e}"

            self.audio_model.update_one(
                {"upload_id": upload_id},
                {
                    "final_denoise_url": processed_audio_url,
                    "status": denoise_status,
                    "message": denoise_message,
                    "last_updated_at": datetime.utcnow()
                }
            )

            # Limpeza do arquivo M4A original (opcional, dependendo da necessidade de retenção)
            # A limpeza do WAV temporário será feita no callback.
            self.audio_processor.cleanup(upload_id, cleanup_m4a=True)
            self.audio_processor.remove_session_data(upload_id) # Remove do cache em memória após o envio

            return AudioProcessResponseSchema().dump({
                "upload_id": upload_id,
                "status": denoise_status,
                "message": denoise_message,
                "processed_audio_url": processed_audio_url # Será o URL retornado pelo serviço de denoising
            }), 200

        except Exception as e:
            # Captura erros gerais no processo de handle_audio_upload antes do denoising
            logger.error(f"Erro geral no handle_audio_upload para ID {upload_id}: {e}", exc_info=True)
            self.audio_model.update_one(
                {"upload_id": upload_id},
                {"status": "upload_failed", "message": f"Erro inesperado no upload: {e}", "last_updated_at": datetime.utcnow()}
            )
            # Tenta limpar o que foi salvo
            self.audio_processor.cleanup(upload_id, cleanup_m4a=True, cleanup_temp_wav=True)
            self.audio_processor.remove_session_data(upload_id)
            return AudioProcessResponseSchema().dump({
                "upload_id": upload_id, "status": "error",
                "message": f"Erro inesperado no upload: {e}"
            }), 500


    def handle_clear_audio_callback(self, audio_file, upload_id_from_form, original_filename_from_form, request_url_root):
        """
        Lida com o callback do serviço de denoising, salvando o áudio processado
        e atualizando o status no MongoDB.
        """
        upload_id = upload_id_from_form
        if not upload_id:
            logger.error("Callback recebido sem upload_id. Não é possível processar.")
            return {
                "error": "ID de upload não fornecido",
                "status": "error",
                "message": "ID de upload é obrigatório para o callback."
            }, 400

        logger.info(f"ID {upload_id}: Requisição /clear_audio (callback) recebida.")

        if not audio_file or audio_file.filename == '':
            logger.error(
                f"ID {upload_id}: Arquivo de áudio vazio ou sem nome no callback /clear_audio.")
            self.audio_model.update_one(
                {"upload_id": upload_id},
                {"status": "callback_no_audio", "message": "Arquivo de áudio vazio ou sem nome no callback.", "last_updated_at": datetime.utcnow()}
            )
            return {
                "error": "Arquivo de áudio vazio",
                "status": "error",
                "message": "Arquivo de áudio vazio ou sem nome."
            }, 400

        original_filename = original_filename_from_form or audio_file.filename or f"denoised_{upload_id}.wav"
        
        # Garante que o filename tenha a extensão .wav
        base_name, ext = os.path.splitext(original_filename)
        unique_filename = f"denoised_{upload_id}_{uuid.uuid4().hex}"
        if ext and ext.lower() in ['.wav', '.mp3', '.m4a']: # Mantenha a extensão original se for uma das permitidas
            unique_filename += ext
        else: # Caso contrário, use .wav como padrão
            unique_filename += '.wav'

        audio_content = audio_file.read()

        try:
            saved_processed_path = self.audio_processor.save_processed_audio_from_external(
                audio_content, unique_filename
            )

            if not os.path.exists(saved_processed_path) or os.path.getsize(saved_processed_path) == 0:
                logger.error(
                    f"ID {upload_id}: Arquivo de áudio NÃO foi salvo ou está vazio após a tentativa de salvar: {saved_processed_path}")
                self.audio_model.update_one(
                    {"upload_id": upload_id},
                    {"status": "denoised_file_save_failed",
                     "message": "Falha ao salvar o arquivo processado",
                     "last_updated_at": datetime.utcnow()}
                )
                return {
                    "error": "Falha ao salvar o arquivo processado",
                    "status": "error",
                    "message": "O arquivo está vazio ou não foi salvo corretamente."
                }, 500

            logger.info(
                f"ID {upload_id}: Áudio recebido e salvo com sucesso em processed_output_folder: {saved_processed_path}")

            # Atualiza o MongoDB para este upload_id
            update_data = {
                "final_denoise_path": saved_processed_path,
                "status": "denoised_completed",
                "message": "Áudio processado e salvo com sucesso.",
                "last_updated_at": datetime.utcnow()
            }

            # A upsert=True aqui garante que um registro seja criado se o upload_id não existia por algum motivo
            # (embora em um fluxo ideal, ele sempre existiria).
            self.audio_model.update_one(
                {"upload_id": upload_id}, update_data, upsert=True
            )

            # Limpa o arquivo WAV temporário
            self.audio_processor.cleanup(upload_id, cleanup_temp_wav=True)
            self.audio_processor.remove_session_data(upload_id) # Remove os dados da sessão em memória

            # Constrói a URL para acesso ao arquivo processado
            processed_audio_url = f"{request_url_root.rstrip('/')}/processed/{unique_filename}"
            logger.info(f"ID {upload_id}: URL do áudio processado: {processed_audio_url}")

            return {
                "status": "success",
                "message": "Áudio processado e salvo com sucesso.",
                "filename": unique_filename,
                "upload_id": upload_id,
                "path": processed_audio_url
            }, 200

        except Exception as e:
            logger.error(
                f"ID {upload_id}: Erro inesperado no callback /clear_audio: {str(e)}", exc_info=True)
            self.audio_model.update_one(
                {"upload_id": upload_id},
                {"status": "callback_failed", "message": f"Erro inesperado no callback: {e}", "last_updated_at": datetime.utcnow()}
            )
            # Tenta limpar o que foi salvo/criado durante o callback
            self.audio_processor.cleanup(upload_id, cleanup_temp_wav=True)
            return {
                "error": f"Erro inesperado no processamento do callback: {e}",
                "status": "error",
                "message": "Erro interno ao processar o callback."
            }, 500

    def get_all_audios_simplified(self):
        """
        Retorna uma lista simplificada de todos os áudios processados
        com base nos registros do MongoDB.
        """
        try:
            # Busca todos os documentos de áudio no MongoDB
            # Filtra por status 'denoised_completed' ou 'processed_successful' se desejar apenas os finalizados
            audios_from_db = self.audio_model.get_all() 
            
            audio_files_list = []
            base_url = current_app.config['BASE_URL'] # Acessa a base URL da configuração

            for audio_doc in audios_from_db:
                file_id = audio_doc.get('upload_id', str(audio_doc.get('_id'))) # Garante um ID
                filename = os.path.basename(audio_doc.get('final_denoise_path') or audio_doc.get('processed_wav_path') or 'unknown_audio.wav')
                
                # Constrói a URL de download para o arquivo processado final
                download_url = None
                if audio_doc.get('final_denoise_path'):
                    download_url = f"{base_url.rstrip('/')}/processed/{os.path.basename(audio_doc['final_denoise_path'])}"
                elif audio_doc.get('processed_wav_path'):
                    # Se não há denoising final, talvez queira o WAV temporário (ajuste conforme seu fluxo)
                    download_url = f"{base_url.rstrip('/')}/temp_wavs/{os.path.basename(audio_doc['processed_wav_path'])}"
                
                audio_files_list.append({
                    "id": file_id,
                    "session_id": file_id, # Usar o upload_id como session_id
                    "filename": filename,
                    "path": download_url, # Este será o URL de download, não o caminho local
                    "size": audio_doc.get('size', 0), # Adicione 'size' ao seu modelo se precisar
                    "created_at": audio_doc.get('created_at'),
                    "title": audio_doc.get('original_filename', filename),
                    "status": audio_doc.get('status', 'unknown'),
                    "message": audio_doc.get('message', 'N/A'),
                })

            audio_files_list.sort(key=lambda x: x['created_at'] or datetime.min, reverse=True) # Garante que a ordenação não falhe com 'None'
            return AudioListSchema(many=True).dump(audio_files_list)

        except Exception as e:
            logger.error(f"Erro ao buscar lista de áudios do MongoDB: {e}", exc_info=True)
            return AudioListSchema(many=True).dump([]) # Retorna lista vazia em caso de erro

    def get_audio_file(self, filename):
        """
        Retorna o caminho completo de um arquivo de áudio processado para download.
        """
        # Verifica se o arquivo existe na pasta de processed (onde os áudios finais são salvos)
        file_path = os.path.join(self.processed_dir, filename)
        if not os.path.exists(file_path):
            logger.error(f"Arquivo de áudio não encontrado no diretório processado: {file_path}")
            return None
        return file_path

    def delete_audio_record(self, upload_id):
        """
        Deleta um registro de áudio do MongoDB e seus arquivos associados no disco.
        """
        audio_doc = self.audio_model.find_one({"upload_id": upload_id})
        if not audio_doc:
            return {"message": "Registro de áudio não encontrado."}, 404

        # Limpa os arquivos no disco
        if audio_doc.get('saved_m4a_path') and os.path.exists(os.path.dirname(audio_doc['saved_m4a_path'])):
            shutil.rmtree(os.path.dirname(audio_doc['saved_m4a_path']))
            logger.info(f"Diretório M4A original limpo para ID {upload_id}.")

        if audio_doc.get('processed_wav_path') and os.path.exists(audio_doc['processed_wav_path']):
            os.remove(audio_doc['processed_wav_path'])
            logger.info(f"Arquivo WAV temporário limpo para ID {upload_id}.")

        if audio_doc.get('final_denoise_path') and os.path.exists(audio_doc['final_denoise_path']):
            os.remove(audio_doc['final_denoise_path'])
            logger.info(f"Arquivo denoised final limpo para ID {upload_id}.")

        # Deleta o registro do MongoDB
        self.audio_model.delete_one({"upload_id": upload_id})
        logger.info(f"Registro de áudio deletado do DB para ID {upload_id}.")

        return {"message": "Áudio e registro deletados com sucesso."}, 200