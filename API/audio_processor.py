import os
import logging
import subprocess
from typing import Dict, List, Optional
import shutil
import io

# Configuração do logger
logger = logging.getLogger(__name__)

class AudioProcessor:
    """
    Classe responsável pelo processamento de áudio.

    Atributos:
        upload_folder (str): Diretório para uploads temporários
        processed_folder (str): Diretório para arquivos processados
        session_data (Dict): Dados das sessões ativas
    """

    def __init__(self, upload_folder: str = 'uploads', processed_folder: str = 'processed'):
        """
        Inicializa o processador de áudio.

        Args:
            upload_folder: Diretório para uploads
            processed_folder: Diretório para arquivos processados
        """
        self.upload_folder = upload_folder
        self.processed_folder = processed_folder
        self.session_data = {}

        # Criar diretórios se não existirem
        os.makedirs(upload_folder, exist_ok=True)
        os.makedirs(processed_folder, exist_ok=True)

    def save_audio_chunk(self, audio_data: bytes, session_id: str, chunk_number: int,
                         content_type: str = 'audio/m4a', filename: Optional[str] = None) -> str:
        """
        Salva um chunk de áudio.

        Args:
            audio_data: Dados do áudio em bytes
            session_id: ID da sessão
            chunk_number: Número do chunk
            content_type: Tipo do conteúdo (usado para inferir a extensão, mas o arquivo é salvo como .m4a)
            filename: Nome do arquivo (se não fornecido, será gerado)

        Returns:
            str: Caminho do arquivo salvo
        """
        try:
            # Criar diretório da sessão se não existir
            session_dir = os.path.join(self.upload_folder, session_id)
            os.makedirs(session_dir, exist_ok=True)

            # Definir nome do arquivo
            if not filename:
                filename = f'chunk_{chunk_number}.m4a'
            elif not filename.endswith('.m4a'):
                # Garantir que o arquivo seja salvo com a extensão .m4a
                filename = os.path.splitext(filename)[0] + '.m4a'

            # Caminho completo do arquivo
            file_path = os.path.join(session_dir, filename)

            # Salvar o chunk de áudio em M4A
            with open(file_path, 'wb') as f:
                f.write(audio_data)

            # Atualizar dados da sessão
            if session_id not in self.session_data:
                self.session_data[session_id] = {
                    'chunks': [],
                    'status': 'uploading'
                }

            self.session_data[session_id]['chunks'].append(file_path)

            logger.info(f"Chunk {chunk_number} salvo com sucesso para sessão {session_id} em {file_path}")
            return file_path

        except Exception as e:
            logger.error(f"Erro ao salvar chunk: {str(e)}")
            raise

    def convert_m4a_to_wav(self, input_path: str, output_path: str) -> None:
        """
        Converte um arquivo M4A para WAV usando FFmpeg.

        Args:
            input_path: Caminho do arquivo M4A de entrada
            output_path: Caminho do arquivo WAV de saída
        """
        try:
            # Comando para converter o arquivo M4A para WAV
            # -y para sobrescrever o arquivo de saída se existir
            command = ['ffmpeg', '-y', '-i', input_path, output_path]
            logger.info(f"Executando comando de conversão M4A para WAV: {' '.join(command)}")
            
            # Executa o comando e captura a saída para depuração
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
            logger.error(f"Erro inesperado ao converter M4A para WAV: {str(e)}")
            raise

    def _concatenate_m4a_chunks_with_ffmpeg(self, chunks_m4a_paths: List[str], output_m4a_path: str) -> None:
        """
        Combina múltiplos chunks M4A em um único arquivo M4A usando o FFmpeg.
        Tenta a concatenação direta e, se falhar, usa uma abordagem mais robusta com filtergraph.

        Args:
            chunks_m4a_paths: Lista de caminhos dos chunks M4A
            output_m4a_path: Caminho do arquivo M4A de saída
        """
        if not chunks_m4a_paths:
            raise ValueError("Nenhum chunk M4A fornecido para concatenação.")

        # Construir a string de entrada para o demuxer concat
        # Usamos caminhos absolutos para evitar problemas de diretório
        concat_input_string = "concat:" + "|".join([os.path.abspath(p) for p in chunks_m4a_paths])

        # --- Tentativa 1: Concatenação direta com demuxer concat (-c copy) ---
        try:
            command_demuxer = [
                'ffmpeg', '-y', '-i', concat_input_string,
                '-c', 'copy',
                '-movflags', '+faststart', # Garante que o moov atom esteja no início
                output_m4a_path
            ]
            logger.info(f"Tentando concatenação M4A com demuxer concat: {' '.join(command_demuxer)}")
            
            result_demuxer = subprocess.run(command_demuxer, check=True, capture_output=True, text=True)
            logger.info(f"FFmpeg stdout (demuxer concat): {result_demuxer.stdout}")
            logger.info(f"FFmpeg stderr (demuxer concat): {result_demuxer.stderr}")
            logger.info(f"Chunks M4A concatenados com sucesso usando demuxer concat em {output_m4a_path}")
            return # Sucesso, sair da função

        except subprocess.CalledProcessError as e:
            logger.warning(f"Falha na concatenação M4A com demuxer concat. Erro: {e.stderr}. Tentando com filtergraph...")
            # Continuar para a Tentativa 2 se a primeira falhar
        except FileNotFoundError:
            logger.error("FFmpeg não encontrado. Certifique-se de que está instalado e no PATH.")
            raise FileNotFoundError("FFmpeg não encontrado. Por favor, instale-o e adicione-o ao seu PATH.")
        except Exception as e:
            logger.warning(f"Erro inesperado na concatenação M4A com demuxer concat: {str(e)}. Tentando com filtergraph...")
            # Continuar para a Tentativa 2 se a primeira falhar

        # --- Tentativa 2: Concatenação com filtergraph (mais robusta, re-codifica) ---
        try:
            filter_parts = []
            input_maps = []
            for i, chunk_path in enumerate(chunks_m4a_paths):
                # Usar amovie para decodificar cada arquivo M4A individualmente
                filter_parts.append(f"amovie='{os.path.abspath(chunk_path)}':s=0[{i}a]")
                input_maps.append(f"[{i}a]")
            
            # Concatenar os streams de áudio decodificados
            concat_filter = f"{''.join(input_maps)}concat=n={len(chunks_m4a_paths)}:v=0:a=1[outa]"
            filter_parts.append(concat_filter)
            
            filtergraph = ';'.join(filter_parts)

            command_filtergraph = [
                'ffmpeg', '-y',
                '-f', 'lavfi', '-i', filtergraph,
                '-map', '[outa]',
                '-c:a', 'aac', '-b:a', '128k', # Re-encode para AAC com bitrate de 128kbps (pode ajustar)
                '-movflags', '+faststart',
                output_m4a_path
            ]
            logger.info(f"Executando concatenação M4A com filtergraph: {' '.join(command_filtergraph)}")
            
            result_filtergraph = subprocess.run(command_filtergraph, check=True, capture_output=True, text=True)
            logger.info(f"FFmpeg stdout (filtergraph): {result_filtergraph.stdout}")
            logger.info(f"FFmpeg stderr (filtergraph): {result_filtergraph.stderr}")
            logger.info(f"Chunks M4A concatenados com sucesso usando filtergraph em {output_m4a_path}")

        except subprocess.CalledProcessError as e:
            logger.error(f"Erro final ao concatenar chunks M4A com filtergraph. Comando: {' '.join(e.cmd)}")
            logger.error(f"FFmpeg stdout: {e.stdout}")
            logger.error(f"FFmpeg stderr: {e.stderr}")
            raise Exception(f"Falha na concatenação de M4A (filtergraph): {e.stderr}")
        except FileNotFoundError:
            logger.error("FFmpeg não encontrado. Certifique-se de que está instalado e no PATH.")
            raise FileNotFoundError("FFmpeg não encontrado. Por favor, instale-o e adicione-o ao seu PATH.")
        except Exception as e:
            logger.error(f"Erro inesperado ao concatenar M4A com filtergraph: {str(e)}")
            raise


    def process_session(self, session_id: str) -> Dict[str, str]:
        """
        Processa todos os chunks de uma sessão.
        Primeiro combina todos os chunks M4A em um único arquivo M4A usando FFmpeg,
        e depois converte este arquivo M4A combinado para WAV.

        Args:
            session_id: ID da sessão

        Returns:
            Dict[str, str]: Resultado do processamento
        """
        try:
            if session_id not in self.session_data:
                return {
                    'status': 'error',
                    'message': 'Sessão não encontrada'
                }

            session_dir = os.path.join(self.upload_folder, session_id)
            if not os.path.exists(session_dir):
                return {
                    'status': 'error',
                    'message': 'Diretório da sessão não encontrado'
                }

            chunks_m4a = self.session_data[session_id]['chunks']
            if not chunks_m4a:
                return {
                    'status': 'error',
                    'message': 'Nenhum chunk encontrado para processamento'
                }

            # 1. Combinar todos os chunks M4A em um único arquivo M4A usando FFmpeg
            combined_m4a_path = os.path.join(session_dir, f'combined_{session_id}.m4a')
            self._concatenate_m4a_chunks_with_ffmpeg(chunks_m4a, combined_m4a_path)
            
            # 2. Converter o arquivo M4A combinado para WAV
            final_wav_output_path = os.path.join(self.processed_folder, f'final_processed_{session_id}.wav')
            self.convert_m4a_to_wav(combined_m4a_path, final_wav_output_path)

            self.session_data[session_id]['status'] = 'processed'
            self.session_data[session_id]['output_path'] = final_wav_output_path
            self.session_data[session_id]['combined_m4a_path'] = combined_m4a_path # Guardar para limpeza

            return {
                'status': 'success',
                'message': 'Áudio processado com sucesso',
                'output_path': final_wav_output_path
            }

        except Exception as e:
            logger.error(f"Erro ao processar sessão {session_id}: {str(e)}")
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
                'chunks_count': len(session_info.get('chunks', [])),
                'output_path': session_info.get('output_path', 'N/A')
            }

        except Exception as e:
            logger.error(f"Erro ao obter status da sessão: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def get_session_chunks(self, session_id: str) -> List[str]:
        """
        Obtém a lista de caminhos dos chunks de uma sessão.
        """
        try:
            if session_id not in self.session_data:
                return []

            return self.session_data[session_id]['chunks']

        except Exception as e:
            logger.error(f"Erro ao obter chunks da sessão: {str(e)}")
            return []

    def cleanup(self, session_id: str) -> None:
        """
        Limpa os recursos de uma sessão (arquivos temporários e dados da sessão).
        """
        try:
            # Remover diretório da sessão de uploads
            session_upload_dir = os.path.join(self.upload_folder, session_id)
            if os.path.exists(session_upload_dir):
                shutil.rmtree(session_upload_dir)
                logger.info(f"Diretório de upload da sessão {session_id} removido.")

            # Remover arquivo M4A combinado intermediário, se existir
            if session_id in self.session_data and 'combined_m4a_path' in self.session_data[session_id]:
                combined_m4a = self.session_data[session_id]['combined_m4a_path']
                if os.path.exists(combined_m4a):
                    os.remove(combined_m4a)
                    logger.info(f"Arquivo M4A combinado {combined_m4a} removido.")

            # Remover arquivo processado final (WAV)
            if session_id in self.session_data and 'output_path' in self.session_data[session_id]:
                processed_file = self.session_data[session_id]['output_path']
                if os.path.exists(processed_file):
                    os.remove(processed_file)
                    logger.info(f"Arquivo processado {processed_file} removido.")
            else:
                # Caso o output_path não esteja na sessão, tentar um nome padrão
                processed_file_fallback = os.path.join(self.processed_folder, f'final_processed_{session_id}.wav')
                if os.path.exists(processed_file_fallback):
                    os.remove(processed_file_fallback)
                    logger.info(f"Arquivo processado de fallback {processed_file_fallback} removido.")

            # Remover dados da sessão
            if session_id in self.session_data:
                del self.session_data[session_id]
                logger.info(f"Dados da sessão {session_id} removidos.")

            logger.info(f"Recursos da sessão {session_id} limpos com sucesso")

        except Exception as e:
            logger.error(f"Erro ao limpar recursos da sessão {session_id}: {str(e)}")
            # Não levantar exceção para que a limpeza não interrompa o fluxo principal
