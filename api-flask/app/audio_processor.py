import os
import subprocess
import shutil
import uuid
from app.extensions import logger # Importa o logger compartilhado

class AudioProcessor:
    def __init__(self, upload_folder, temp_wav_folder, processed_output_folder):
        """
        Inicializa o AudioProcessor com os caminhos das pastas de upload,
        temporários e processados, fornecidos pela configuração da aplicação Flask.

        Args:
            upload_folder (str): Caminho para a pasta onde os áudios M4A originais são salvos.
            temp_wav_folder (str): Caminho para a pasta onde os áudios WAV temporários são salvos.
            processed_output_folder (str): Caminho para a pasta onde os áudios processados finais são salvos.
        """
        self.upload_folder = upload_folder
        self.temp_wav_folder = temp_wav_folder
        self.processed_output_folder = processed_output_folder

        # Cria os diretórios se não existirem
        os.makedirs(self.upload_folder, exist_ok=True)
        os.makedirs(self.temp_wav_folder, exist_ok=True)
        os.makedirs(self.processed_output_folder, exist_ok=True)

        # session_data: Armazena caminhos de arquivos temporários relacionados a uma sessão
        # (cache em memória). É crucial que o ciclo de vida desses dados seja gerenciado
        # pelo AudioService, garantindo que os arquivos sejam limpos após a persistência.
        self.session_data = {}

    def save_final_audio(self, audio_data, session_id, filename="audio.m4a"):
        """
        Salva o áudio M4A final carregado na pasta de upload.
        Cria uma subpasta para cada session_id para melhor organização.

        Args:
            audio_data (bytes): Conteúdo binário do arquivo de áudio.
            session_id (str): ID único da sessão/upload.
            filename (str): Nome original do arquivo.

        Returns:
            str: Caminho completo onde o arquivo M4A foi salvo.
        Raises:
            Exception: Se houver um erro ao salvar o arquivo.
        """
        session_upload_dir = os.path.join(self.upload_folder, session_id)
        os.makedirs(session_upload_dir, exist_ok=True)
        
        # Garante que o nome do arquivo tenha a extensão .m4a
        if not filename.lower().endswith('.m4a'):
            filename = f"{os.path.splitext(filename)[0]}.m4a"

        m4a_path = os.path.join(session_upload_dir, filename)
        try:
            with open(m4a_path, 'wb') as f:
                f.write(audio_data)
            # Armazena o caminho inicial e o status nos dados da sessão em memória
            self.session_data[session_id] = {'final_m4a_path': m4a_path, 'status': 'uploaded'}
            logger.info(f"Áudio M4A final salvo para sessão {session_id} em: {m4a_path}")
            return m4a_path
        except Exception as e:
            logger.error(f"Erro ao salvar o áudio M4A final para sessão {session_id}: {e}", exc_info=True)
            raise

    def process_session(self, session_id):
        """
        Converte o áudio M4A de uma sessão para o formato WAV usando FFmpeg.
        O arquivo WAV é salvo na pasta temp_wav_folder.

        Args:
            session_id (str): ID único da sessão/upload.

        Returns:
            dict: Um dicionário com o status ('success' ou 'error') e o caminho de saída
                  do arquivo WAV ou uma mensagem de erro.
        """
        if session_id not in self.session_data or 'final_m4a_path' not in self.session_data[session_id]:
            logger.error(f"Nenhum áudio M4A encontrado em session_data para processar a sessão {session_id}.")
            return {"status": "error", "message": "Nenhum áudio M4A encontrado para esta sessão para processar."}

        m4a_path = self.session_data[session_id]['final_m4a_path']
        
        # Define o caminho de saída do WAV na nova pasta temp_wav_folder
        wav_filename = f"converted_{session_id}.wav"
        wav_path = os.path.join(self.temp_wav_folder, wav_filename)

        try:
            # Comando FFmpeg para converter M4A para WAV
            command = [
                'ffmpeg',
                '-i', m4a_path,
                '-acodec', 'pcm_s16le', # PCM signed 16-bit little-endian
                '-ar', '44100',         # 44.1 kHz sample rate
                '-ac', '1',             # Áudio mono
                '-y',                   # Sobrescreve o arquivo de saída se existir
                wav_path
            ]
            # Executa o comando FFmpeg, capturando a saída e verificando erros
            process = subprocess.run(command, check=True, capture_output=True, text=True)
            logger.debug(f"FFmpeg stdout para sessão {session_id}: {process.stdout}")
            logger.debug(f"FFmpeg stderr para sessão {session_id}: {process.stderr}")
            
            # Verifica se o arquivo WAV foi realmente criado e não está vazio
            if not os.path.exists(wav_path) or os.path.getsize(wav_path) == 0:
                raise FileNotFoundError(f"Arquivo WAV não foi criado ou está vazio: {wav_path}")

            self.session_data[session_id]['processed_wav_path'] = wav_path
            self.session_data[session_id]['status'] = 'processed'
            logger.info(f"Áudio para sessão {session_id} convertido para WAV em: {wav_path}")
            return {"status": "success", "output_path": wav_path}
        except subprocess.CalledProcessError as e:
            logger.error(f"Erro de conversão FFmpeg para sessão {session_id}: {e.stderr}", exc_info=True)
            return {"status": "error", "message": f"Falha na conversão FFmpeg: {e.stderr}"}
        except FileNotFoundError as e:
            logger.error(f"Erro de arquivo no processamento FFmpeg para sessão {session_id}: {e}", exc_info=True)
            return {"status": "error", "message": f"Erro de arquivo no processamento FFmpeg: {e}"}
        except Exception as e:
            logger.error(f"Erro inesperado durante o processamento de áudio para sessão {session_id}: {e}", exc_info=True)
            return {"status": "error", "message": f"Erro interno de processamento: {e}"}

    def cleanup(self, session_id, cleanup_m4a=False, cleanup_temp_wav=False):
        """
        Limpa arquivos temporários para uma dada sessão com base nas flags.
        Não remove os dados da sessão do cache em memória.

        Args:
            session_id (str): ID único da sessão.
            cleanup_m4a (bool): Se True, remove a pasta de upload M4A da sessão.
            cleanup_temp_wav (bool): Se True, remove o arquivo WAV temporário da sessão.
        """
        # Limpa o diretório de upload M4A
        if cleanup_m4a:
            m4a_dir = os.path.join(self.upload_folder, session_id)
            if os.path.exists(m4a_dir):
                try:
                    shutil.rmtree(m4a_dir)
                    logger.info(f"Diretório de upload M4A limpo para sessão {session_id}: {m4a_dir}")
                except OSError as e:
                    logger.warning(f"Não foi possível remover o diretório de upload M4A {m4a_dir}: {e}")
            else:
                logger.debug(f"Diretório de upload M4A não encontrado para sessão {session_id}: {m4a_dir}")

        # Limpa o arquivo WAV temporário
        if cleanup_temp_wav:
            # Obtém o caminho dos dados da sessão se disponível, ou constrói-o
            temp_wav_file = self.session_data.get(session_id, {}).get('processed_wav_path')
            if not temp_wav_file:
                # Fallback: constrói o caminho se não estiver em session_data (ex: se o app foi reiniciado)
                temp_wav_file = os.path.join(self.temp_wav_folder, f"converted_{session_id}.wav")

            if os.path.exists(temp_wav_file):
                try:
                    os.remove(temp_wav_file)
                    logger.info(f"Arquivo WAV temporário limpo para sessão {session_id}: {temp_wav_file}")
                except OSError as e:
                    logger.warning(f"Não foi possível remover o arquivo WAV temporário {temp_wav_file}: {e}")
            else:
                logger.debug(f"Arquivo WAV temporário não encontrado para sessão {session_id}: {temp_wav_file}")
    
    def remove_session_data(self, session_id):
        """
        Remove os dados específicos da sessão do cache em memória.
        Isso deve ser chamado quando o processamento da sessão estiver totalmente concluído
        e seus dados forem persistidos no banco de dados.

        Args:
            session_id (str): ID único da sessão.
        """
        if session_id in self.session_data:
            del self.session_data[session_id]
            logger.info(f"Dados da sessão {session_id} removidos do cache em memória.")
        else:
            logger.debug(f"Nenhum dado de sessão encontrado para {session_id} para remover do cache em memória.")

    def save_processed_audio_from_external(self, audio_data, filename):
        """
        Salva um arquivo de áudio recebido de um microsserviço externo (ex: áudio denoised).
        Este arquivo é salvo diretamente na pasta processed_output_folder.

        Args:
            audio_data (bytes): Conteúdo binário do arquivo de áudio.
            filename (str): Nome do arquivo a ser salvo.

        Returns:
            str: Caminho completo onde o arquivo processado foi salvo.
        Raises:
            Exception: Se houver um erro ao salvar o arquivo.
        """
        # Garante que a pasta processed_output_folder exista
        os.makedirs(self.processed_output_folder, exist_ok=True)
        
        save_path = os.path.join(self.processed_output_folder, filename)
        try:
            with open(save_path, 'wb') as f:
                f.write(audio_data)
            logger.info(f"Áudio processado externo salvo em: {save_path}")
            return save_path
        except Exception as e:
            logger.error(f"Erro ao salvar áudio processado externo em {save_path}: {e}", exc_info=True)
            raise
