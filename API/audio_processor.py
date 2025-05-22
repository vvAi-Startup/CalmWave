import os
import logging
import subprocess
import shutil
from typing import Dict, List, Optional

# Configuração do logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Classe responsável pelo processamento de áudio final.

    Atributos:
        upload_folder (str): Diretório para uploads temporários do áudio final M4A.
        converted_folder (str): Diretório para arquivos processados (WAV).
        session_data (Dict): Dados das sessões ativas (armazena apenas o caminho do áudio final M4A).
    """

    def __init__(self, upload_folder: str = 'uploads', converted_folder: str = 'temp_audio'):
        """
        Inicializa o processador de áudio.

        Args:
            upload_folder: Diretório para uploads temporários do M4A final.
            converted_folder: Diretório para arquivos WAV processados.
        """
        self.upload_folder = upload_folder
        self.converted_folder = converted_folder
        self.session_data = {}

        # Criar diretórios se não existirem
        os.makedirs(upload_folder, exist_ok=True)
        os.makedirs(converted_folder, exist_ok=True)
        logger.info(f"Diretórios de áudio inicializados: uploads='{upload_folder}', converted='{converted_folder}'")

    def save_final_audio(self, audio_data: bytes, session_id: str, filename: str = 'final_audio.m4a') -> str:
        """
        Salva o arquivo de áudio final M4A para uma sessão.

        Args:
            audio_data: Dados do áudio em bytes.
            session_id: ID da sessão.
            filename: Nome do arquivo (padrão 'final_audio.m4a').

        Returns:
            str: Caminho completo do arquivo M4A salvo.
        """
        try:
            session_dir = os.path.join(self.upload_folder, session_id)
            os.makedirs(session_dir, exist_ok=True)

            # Garante que o nome do arquivo tenha a extensão .m4a
            if not filename.endswith('.m4a'):
                filename = os.path.splitext(filename)[0] + '.m4a'
            
            final_m4a_file_path = os.path.join(session_dir, filename)

            with open(final_m4a_file_path, 'wb') as f:
                f.write(audio_data)
            logger.info(f"Áudio final M4A salvo para sessão {session_id} em: {final_m4a_file_path}")

            # Armazenar o caminho do arquivo M4A final na sessão em memória
            self.session_data[session_id] = {
                'final_m4a_path': final_m4a_file_path,
                'status': 'uploaded'
            }

            return final_m4a_file_path

        except Exception as e:
            logger.error(f"Erro ao salvar o áudio final para sessão {session_id}: {str(e)}", exc_info=True)
            raise

    def convert_m4a_to_wav(self, input_path: str, output_path: str) -> None:
        """
        Converte um arquivo M4A para WAV usando FFmpeg.

        Args:
            input_path: Caminho do arquivo M4A de entrada.
            output_path: Caminho do arquivo WAV de saída.
        """
        try:
            # Comando para converter o arquivo M4A para WAV
            # -y para sobrescrever o arquivo de saída se existir
            command = ['ffmpeg', '-y', '-i', input_path, output_path]
            logger.info(f"Executando comando de conversão M4A para WAV: {' '.join(command)}")
            
            result = subprocess.run(command, check=True, capture_output=True, text=True)
            logger.info(f"FFmpeg stdout (M4A to WAV): {result.stdout}")
            logger.info(f"FFmpeg stderr (M4A to WAV): {result.stderr}")
            logger.info(f"Arquivo convertido com sucesso para {output_path}")

        except subprocess.CalledProcessError as e:
            logger.error(f"Erro ao converter M4A para WAV. Comando: {' '.join(e.cmd)}")
            logger.error(f"FFmpeg stdout: {e.stdout}")
            logger.error(f"FFmpeg stderr: {e.stderr}")
            raise Exception(f"Falha na conversão M4A para WAV: {e.stderr}")
        except FileNotFoundError:
            logger.error("FFmpeg não encontrado. Certifique-se de que está instalado e no PATH.")
            raise FileNotFoundError("FFmpeg não encontrado. Por favor, instale-o e adicione-o ao seu PATH.")
        except Exception as e:
            logger.error(f"Erro inesperado ao converter M4A para WAV: {str(e)}", exc_info=True)
            raise

    def process_session(self, session_id: str) -> Dict[str, str]:
        """
        Processa o áudio final de uma sessão, convertendo-o de M4A para WAV.

        Args:
            session_id: ID da sessão.

        Returns:
            Dict[str, str]: Resultado do processamento, incluindo o caminho do arquivo WAV.
        """
        try:
            if session_id not in self.session_data:
                logger.error(f"Sessão {session_id} não encontrada para processamento.")
                return {
                    'status': 'error',
                    'message': 'Sessão não encontrada ou áudio não foi salvo.'
                }

            final_m4a_path = self.session_data[session_id].get('final_m4a_path')
            if not final_m4a_path or not os.path.exists(final_m4a_path):
                logger.error(f"Caminho do áudio final M4A não encontrado ou arquivo ausente para sessão {session_id}.")
                return {
                    'status': 'error',
                    'message': 'Caminho do áudio final M4A não encontrado ou arquivo ausente.'
                }

            # Converter o arquivo M4A final para WAV
            final_wav_output_path = os.path.join(self.converted_folder, f'converted_{session_id}.wav')
            self.convert_m4a_to_wav(final_m4a_path, final_wav_output_path)

            self.session_data[session_id]['status'] = 'converted'
            self.session_data[session_id]['output_path'] = final_wav_output_path

            logger.info(f"Sessão {session_id} processada com sucesso. WAV em: {final_wav_output_path}")
            return {
                'status': 'success',
                'message': 'Áudio processado com sucesso',
                'output_path': final_wav_output_path
            }

        except Exception as e:
            logger.error(f"Erro ao processar sessão {session_id}: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': f"Erro no processamento da sessão: {str(e)}"
            }

    def get_session_status(self, session_id: str) -> Dict[str, str]:
        """
        Obtém o status de uma sessão.
        """
        try:
            if session_id not in self.session_data:
                return {
                    'status': 'not_found',
                    'message': 'Sessão não encontrada'
                }

            session_info = self.session_data[session_id]
            return {
                'status': 'success',
                'session_status': session_info.get('status', 'unknown'),
                'output_path': session_info.get('output_path', 'N/A')
            }

        except Exception as e:
            logger.error(f"Erro ao obter status da sessão {session_id}: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': str(e)
            }

    def get_session_final_audio_path(self, session_id: str) -> Optional[str]:
        """
        Obtém o caminho do arquivo M4A final de uma sessão.
        """
        try:
            return self.session_data.get(session_id, {}).get('final_m4a_path')
        except Exception as e:
            logger.error(f"Erro ao obter caminho do áudio final para sessão {session_id}: {str(e)}", exc_info=True)
            return None

    def cleanup(self, session_id: str) -> None:
        """
        Limpa os recursos temporários de uma sessão.
        O arquivo WAV final processado NÃO será removido.
        """
        try:
            # Remover diretório da sessão de uploads (onde o M4A final está)
            session_upload_dir = os.path.join(self.upload_folder, session_id)
            if os.path.exists(session_upload_dir):
                shutil.rmtree(session_upload_dir)
                logger.info(f"Diretório de upload da sessão {session_id} removido (inclui M4A final).")

            # O arquivo WAV final (converted_{session_id}.wav) permanece na pasta 'converted'.

            # Remover dados da sessão da memória
            if session_id in self.session_data:
                del self.session_data[session_id]
                logger.info(f"Dados da sessão {session_id} removidos da memória.")

            logger.info(f"Recursos temporários da sessão {session_id} limpos com sucesso. Arquivo WAV final mantido.")

        except Exception as e:
            logger.error(f"Erro ao limpar recursos da sessão {session_id}: {str(e)}", exc_info=True)
            # Não levantar exceção para que a limpeza não interrompa o fluxo principal
