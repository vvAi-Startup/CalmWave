import os
import logging
import numpy as np
import librosa
from typing import Dict, List, Optional, Tuple
import shutil
import json

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
                        content_type: str = 'audio/wav', filename: str = None) -> str:
        """
        Salva um chunk de áudio.
        
        Args:
            audio_data: Dados do áudio em bytes
            session_id: ID da sessão
            chunk_number: Número do chunk
            content_type: Tipo do conteúdo
            filename: Nome do arquivo
            
        Returns:
            str: Caminho do arquivo salvo
        """
        try:
            # Criar diretório da sessão se não existir
            session_dir = os.path.join(self.upload_folder, session_id)
            os.makedirs(session_dir, exist_ok=True)
            
            # Definir nome do arquivo
            if not filename:
                filename = f'chunk_{chunk_number}.wav'
            
            # Caminho completo do arquivo
            file_path = os.path.join(session_dir, filename)
            
            # Salvar arquivo
            with open(file_path, 'wb') as f:
                f.write(audio_data)
            
            # Atualizar dados da sessão
            if session_id not in self.session_data:
                self.session_data[session_id] = {
                    'chunks': [],
                    'status': 'uploading'
                }
            
            self.session_data[session_id]['chunks'].append(file_path)
            
            logger.info(f"Chunk {chunk_number} salvo com sucesso para sessão {session_id}")
            return file_path
            
        except Exception as e:
            logger.error(f"Erro ao salvar chunk: {str(e)}")
            raise

    def process_session(self, session_id: str) -> Dict:
        """
        Processa todos os chunks de uma sessão.
        
        Args:
            session_id: ID da sessão
            
        Returns:
            Dict: Resultado do processamento
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
            
            # Listar chunks
            chunks = self.session_data[session_id]['chunks']
            if not chunks:
                return {
                    'status': 'error',
                    'message': 'Nenhum chunk encontrado'
                }
            
            # Processar áudio
            output_path = os.path.join(self.processed_folder, f'processed_{session_id}.wav')
            
            # Combinar chunks
            self._combine_chunks(chunks, output_path)
            
            # Atualizar status
            self.session_data[session_id]['status'] = 'processed'
            self.session_data[session_id]['output_path'] = output_path
            
            return {
                'status': 'success',
                'message': 'Áudio processado com sucesso',
                'output_path': output_path
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar sessão: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def _combine_chunks(self, chunks: List[str], output_path: str) -> None:
        """
        Combina múltiplos chunks em um único arquivo.
        
        Args:
            chunks: Lista de caminhos dos chunks
            output_path: Caminho do arquivo de saída
        """
        try:
            # Carregar e combinar áudios
            combined_audio = None
            
            for chunk_path in chunks:
                audio, sr = librosa.load(chunk_path, sr=None)
                
                if combined_audio is None:
                    combined_audio = audio
                else:
                    combined_audio = np.concatenate([combined_audio, audio])
            
            # Salvar áudio combinado
            librosa.output.write_wav(output_path, combined_audio, sr)
            
        except Exception as e:
            logger.error(f"Erro ao combinar chunks: {str(e)}")
            raise

    def get_session_status(self, session_id: str) -> Dict:
        """
        Obtém o status de uma sessão.
        
        Args:
            session_id: ID da sessão
            
        Returns:
            Dict: Status da sessão
        """
        try:
            if session_id not in self.session_data:
                return {
                    'status': 'not_found',
                    'message': 'Sessão não encontrada'
                }
            
            return {
                'status': 'success',
                'session_status': self.session_data[session_id]['status'],
                'chunks_count': len(self.session_data[session_id]['chunks'])
            }
            
        except Exception as e:
            logger.error(f"Erro ao obter status da sessão: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

    def get_session_chunks(self, session_id: str) -> List[str]:
        """
        Obtém a lista de chunks de uma sessão.
        
        Args:
            session_id: ID da sessão
            
        Returns:
            List[str]: Lista de caminhos dos chunks
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
        Limpa os recursos de uma sessão.
        
        Args:
            session_id: ID da sessão
        """
        try:
            # Remover diretório da sessão
            session_dir = os.path.join(self.upload_folder, session_id)
            if os.path.exists(session_dir):
                shutil.rmtree(session_dir)
            
            # Remover arquivo processado
            processed_file = os.path.join(self.processed_folder, f'processed_{session_id}.wav')
            if os.path.exists(processed_file):
                os.remove(processed_file)
            
            # Remover dados da sessão
            if session_id in self.session_data:
                del self.session_data[session_id]
            
            logger.info(f"Recursos da sessão {session_id} limpos com sucesso")
            
        except Exception as e:
            logger.error(f"Erro ao limpar recursos da sessão: {str(e)}")
            raise 