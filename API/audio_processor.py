import os
import logging
import tempfile
from pydub import AudioSegment
import soundfile as sf
import numpy as np
import json
import time
import mimetypes
import wave
import io

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AudioProcessor:
    def __init__(self):
        self.upload_folder = 'uploads'
        self.processed_folder = 'processed'
        self._ensure_folders()

    def _ensure_folders(self):
        """Garante que as pastas necessárias existam"""
        for folder in [self.upload_folder, self.processed_folder]:
            if not os.path.exists(folder):
                os.makedirs(folder)
                logger.info(f"Pasta criada: {folder}")

    def _detect_audio_format(self, data, content_type=None, filename=None):
        """Detecta o formato do áudio a partir dos primeiros bytes e metadados"""
        if not data:
            return None

        # Verificar Content-Type se disponível
        if content_type:
            if 'audio/wav' in content_type:
                logger.info("Formato WAV detectado pelo Content-Type")
                return 'wav'
            elif 'audio/m4a' in content_type or 'audio/mp4' in content_type:
                logger.info("Formato M4A detectado pelo Content-Type")
                return 'm4a'
            elif 'audio/webm' in content_type:
                logger.info("Formato WebM detectado pelo Content-Type")
                return 'webm'

        # Verificar extensão do arquivo se disponível
        if filename:
            ext = os.path.splitext(filename)[1].lower()
            if ext == '.wav':
                logger.info("Formato WAV detectado pela extensão")
                return 'wav'
            elif ext == '.m4a':
                logger.info("Formato M4A detectado pela extensão")
                return 'm4a'
            elif ext == '.webm':
                logger.info("Formato WebM detectado pela extensão")
                return 'webm'

        # Verificar assinaturas de formato
        signatures = {
            b'RIFF': 'wav',
            b'OggS': 'ogg',
            b'ID3': 'mp3',
            b'fLaC': 'flac',
            b'WEBM': 'webm',
            b'ftypM4A': 'm4a',
            b'ftypM4V': 'm4a',
            b'ftypmp4': 'm4a'
        }

        for signature, format_type in signatures.items():
            if data.startswith(signature):
                logger.info(f"Formato {format_type} detectado pela assinatura")
                return format_type

        logger.warning("Formato não detectado, usando formato padrão (wav)")
        return 'wav'

    def _convert_m4a_to_wav(self, input_path, output_path):
        """Converte arquivo M4A para WAV usando pydub"""
        try:
            # Verificar se o arquivo existe e tem conteúdo
            if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
                logger.error(f"Arquivo M4A inválido ou vazio: {input_path}")
                return False

            logger.info(f"Tentando converter M4A para WAV: {input_path}")
            logger.info(f"Tamanho do arquivo M4A: {os.path.getsize(input_path)} bytes")
            
            # Tentar diferentes formatos de entrada para M4A
            formats_to_try = ["m4a", "mp4", "aac"]
            
            for format_type in formats_to_try:
                try:
                    logger.info(f"Tentando converter M4A com formato: {format_type}")
                    audio = AudioSegment.from_file(input_path, format=format_type)
                    
                    # Configurar parâmetros de saída
                    audio = audio.set_channels(1)  # Mono
                    audio = audio.set_frame_rate(44100)  # 44.1kHz
                    audio = audio.set_sample_width(2)  # 16-bit
                    
                    # Exportar para WAV
                    audio.export(output_path, format="wav")
                    logger.info(f"Conversão M4A para WAV bem sucedida usando formato {format_type}: {output_path}")
                    return True
                except Exception as e:
                    logger.warning(f"Falha na conversão com formato {format_type}: {str(e)}")
                    continue

            # Se nenhum formato funcionou, tentar conversão genérica
            try:
                logger.info("Tentando conversão genérica do M4A")
                audio = AudioSegment.from_file(input_path)
                audio = audio.set_channels(1)
                audio = audio.set_frame_rate(44100)
                audio = audio.set_sample_width(2)
                audio.export(output_path, format="wav")
                logger.info(f"Conversão genérica M4A para WAV bem sucedida: {output_path}")
                return True
            except Exception as e:
                logger.error(f"Falha na conversão genérica do M4A: {str(e)}")
                return False

        except Exception as e:
            logger.error(f"Erro na conversão M4A para WAV: {str(e)}")
            return False

    def _save_temp_file(self, data, session_id, chunk_number, extension='.webm'):
        """Salva dados em um arquivo temporário com extensão específica"""
        temp_path = os.path.join(tempfile.gettempdir(), f'temp_{session_id}_{chunk_number}{extension}')
        with open(temp_path, 'wb') as f:
            f.write(data)
        logger.info(f"Arquivo temporário salvo em: {temp_path}")
        return temp_path

    def _convert_webm_to_wav(self, input_path, output_path):
        """Converte arquivo WebM para WAV usando pydub"""
        try:
            # Verificar se o arquivo existe e tem conteúdo
            if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
                logger.error(f"Arquivo WebM inválido ou vazio: {input_path}")
                return False

            # Tentar diferentes formatos de entrada para WebM
            formats_to_try = ["webm", "webm;codecs=opus", "webm;codecs=vorbis"]
            
            for format_type in formats_to_try:
                try:
                    logger.info(f"Tentando converter WebM com formato: {format_type}")
                    audio = AudioSegment.from_file(input_path, format=format_type)
                    
                    # Configurar parâmetros de saída
                    audio = audio.set_channels(1)  # Mono
                    audio = audio.set_frame_rate(44100)  # 44.1kHz
                    audio = audio.set_sample_width(2)  # 16-bit
                    
                    # Exportar para WAV
                    audio.export(output_path, format="wav")
                    logger.info(f"Conversão WebM para WAV bem sucedida: {output_path}")
                    return True
                except Exception as e:
                    logger.warning(f"Falha na conversão com formato {format_type}: {str(e)}")
                    continue

            # Se nenhum formato funcionou, tentar conversão genérica
            try:
                logger.info("Tentando conversão genérica do WebM")
                audio = AudioSegment.from_file(input_path)
                audio = audio.set_channels(1)
                audio = audio.set_frame_rate(44100)
                audio = audio.set_sample_width(2)
                audio.export(output_path, format="wav")
                logger.info(f"Conversão genérica WebM para WAV bem sucedida: {output_path}")
                return True
            except Exception as e:
                logger.error(f"Falha na conversão genérica do WebM: {str(e)}")
                return False

        except Exception as e:
            logger.error(f"Erro na conversão WebM para WAV: {str(e)}")
            return False

    def _convert_to_wav(self, input_path, output_path):
        """Converte arquivo de áudio para WAV usando pydub"""
        try:
            # Verificar se o arquivo existe e tem conteúdo
            if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
                logger.error(f"Arquivo de entrada inválido ou vazio: {input_path}")
                return False

            # Tentar carregar o áudio com pydub
            audio = AudioSegment.from_file(input_path)
            
            # Configurar parâmetros de saída
            audio = audio.set_channels(1)  # Mono
            audio = audio.set_frame_rate(44100)  # 44.1kHz
            audio = audio.set_sample_width(2)  # 16-bit
            
            # Exportar para WAV
            audio.export(output_path, format='wav')
            logger.info(f"Conversão para WAV bem sucedida: {output_path}")
            return True
        except Exception as e:
            logger.error(f"Erro na conversão com pydub: {str(e)}")
            return False

    def save_audio_chunk(self, audio_data, session_id, chunk_number, content_type=None, filename=None):
        """Salva um chunk de áudio no formato original"""
        try:
            if not audio_data:
                raise ValueError("Dados de áudio vazios")

            # Criar pasta da sessão se não existir
            session_folder = os.path.join(self.upload_folder, session_id)
            if not os.path.exists(session_folder):
                os.makedirs(session_folder)
                logger.info(f"Pasta da sessão criada: {session_folder}")

            # Detectar formato do áudio
            format_type = self._detect_audio_format(audio_data, content_type, filename)
            logger.info(f"Formato detectado para chunk {chunk_number}: {format_type}")
            logger.info(f"Tamanho dos dados de áudio: {len(audio_data)} bytes")

            # Salvar arquivo no formato original
            extension = f'.{format_type}'
            output_path = os.path.join(session_folder, f'chunk_{chunk_number:04d}{extension}')
            
            with open(output_path, 'wb') as f:
                f.write(audio_data)
            
            logger.info(f"Arquivo salvo no formato original: {output_path}")
            logger.info(f"Tamanho do arquivo: {os.path.getsize(output_path)} bytes")

            return {
                "chunk_number": chunk_number,
                "chunk_path": output_path,
                "session_id": session_id,
                "format": format_type,
                "message": "Chunk processado com sucesso"
            }

        except Exception as e:
            logger.error(f"Erro ao processar chunk {chunk_number}: {str(e)}", exc_info=True)
            raise

    def convert_for_docker(self, input_path, output_path):
        """Converte o arquivo para WAV antes de enviar para o Docker"""
        try:
            if not os.path.exists(input_path) or os.path.getsize(input_path) == 0:
                logger.error(f"Arquivo de entrada inválido ou vazio: {input_path}")
                return False

            # Detectar formato do arquivo
            format_type = os.path.splitext(input_path)[1].lower().replace('.', '')
            logger.info(f"Convertendo arquivo {format_type} para WAV: {input_path}")

            if format_type == 'm4a':
                return self._convert_m4a_to_wav(input_path, output_path)
            elif format_type == 'webm':
                return self._convert_webm_to_wav(input_path, output_path)
            else:
                return self._convert_to_wav(input_path, output_path)

        except Exception as e:
            logger.error(f"Erro na conversão para Docker: {str(e)}")
            return False

    def process_session(self, session_id):
        """Processa todos os chunks de uma sessão"""
        try:
            session_folder = os.path.join(self.upload_folder, session_id)
            if not os.path.exists(session_folder):
                raise ValueError(f"Sessão não encontrada: {session_id}")

            # Listar todos os chunks
            chunks = sorted([f for f in os.listdir(session_folder) if f.startswith('chunk_')])
            if not chunks:
                raise ValueError(f"Nenhum chunk encontrado na sessão: {session_id}")

            logger.info(f"Processando {len(chunks)} chunks da sessão {session_id}")

            # Criar pasta temporária para os WAVs
            temp_wav_folder = os.path.join(tempfile.gettempdir(), f'wav_{session_id}')
            if not os.path.exists(temp_wav_folder):
                os.makedirs(temp_wav_folder)

            # Converter cada chunk para WAV
            wav_chunks = []
            for chunk in chunks:
                chunk_path = os.path.join(session_folder, chunk)
                wav_path = os.path.join(temp_wav_folder, f"{os.path.splitext(chunk)[0]}.wav")
                
                if self.convert_for_docker(chunk_path, wav_path):
                    wav_chunks.append(wav_path)
                else:
                    logger.error(f"Falha ao converter chunk {chunk} para WAV")

            if not wav_chunks:
                raise Exception("Nenhum chunk foi convertido com sucesso")

            # Combinar chunks WAV
            combined = AudioSegment.empty()
            for wav_chunk in wav_chunks:
                try:
                    audio = AudioSegment.from_wav(wav_chunk)
                    combined += audio
                    logger.info(f"Chunk {wav_chunk} processado com sucesso")
                except Exception as e:
                    logger.error(f"Erro ao processar chunk {wav_chunk}: {str(e)}")
                    raise

            # Salvar arquivo combinado
            output_path = os.path.join(self.processed_folder, f'processed_{session_id}.wav')
            combined.export(output_path, format='wav')
            logger.info(f"Áudio combinado salvo em: {output_path}")

            # Limpar pasta temporária
            for wav_chunk in wav_chunks:
                try:
                    os.remove(wav_chunk)
                except Exception as e:
                    logger.warning(f"Erro ao remover arquivo temporário {wav_chunk}: {str(e)}")
            try:
                os.rmdir(temp_wav_folder)
            except Exception as e:
                logger.warning(f"Erro ao remover pasta temporária: {str(e)}")

            return {
                "status": "success",
                "message": "Áudio processado com sucesso",
                "output_path": output_path,
                "session_id": session_id
            }

        except Exception as e:
            logger.error(f"Erro ao processar sessão {session_id}: {str(e)}", exc_info=True)
            return {
                "status": "error",
                "message": f"Erro ao processar áudio: {str(e)}",
                "session_id": session_id
            }

    def get_session_status(self, session_id):
        """Retorna o status atual da sessão"""
        try:
            session_folder = os.path.join(self.upload_folder, session_id)
            if not os.path.exists(session_folder):
                return {
                    "status": "not_found",
                    "message": "Sessão não encontrada",
                    "session_id": session_id
                }

            chunks = sorted([f for f in os.listdir(session_folder) if f.startswith('chunk_')])
            processed_file = os.path.join(self.processed_folder, f'processed_{session_id}.wav')

            return {
                "status": "success",
                "message": "Status da sessão recuperado",
                "session_id": session_id,
                "chunks_count": len(chunks),
                "is_processed": os.path.exists(processed_file),
                "processed_path": processed_file if os.path.exists(processed_file) else None
            }

        except Exception as e:
            logger.error(f"Erro ao verificar status da sessão {session_id}: {str(e)}")
            return {
                "status": "error",
                "message": f"Erro ao verificar status: {str(e)}",
                "session_id": session_id
            }

    def get_session_chunks(self, session_id):
        """Retorna a lista de chunks de uma sessão"""
        try:
            session_folder = os.path.join(self.upload_folder, session_id)
            if not os.path.exists(session_folder):
                return []

            chunks = sorted([f for f in os.listdir(session_folder) if f.startswith('chunk_')])
            return [os.path.join(session_folder, chunk) for chunk in chunks]
        except Exception as e:
            logger.error(f"Erro ao listar chunks da sessão {session_id}: {str(e)}")
            return []

    def cleanup(self, session_id):
        """Remove arquivos temporários da sessão"""
        try:
            session_folder = os.path.join(self.upload_folder, session_id)
            if os.path.exists(session_folder):
                for file in os.listdir(session_folder):
                    os.remove(os.path.join(session_folder, file))
                os.rmdir(session_folder)
                logger.info(f"Pasta da sessão removida: {session_folder}")

            processed_file = os.path.join(self.processed_folder, f'processed_{session_id}.wav')
            if os.path.exists(processed_file):
                os.remove(processed_file)
                logger.info(f"Arquivo processado removido: {processed_file}")

        except Exception as e:
            logger.error(f"Erro na limpeza da sessão {session_id}: {str(e)}", exc_info=True)
            raise 