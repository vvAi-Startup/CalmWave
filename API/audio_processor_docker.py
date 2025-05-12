import docker
import librosa
import numpy as np
import logging
from typing import Dict, List, Optional, Tuple
import os
import time

# Configuração do logger
logger = logging.getLogger(__name__)

class DockerAudioProcessor:
    """
    Classe responsável pelo processamento de áudio em Docker.
    
    Atributos:
        client (docker.DockerClient): Cliente Docker
        image_name (str): Nome da imagem Docker
        container_name (str): Nome do container
        volume_path (str): Caminho do volume
    """
    
    def __init__(self, image_name: str = 'calmwave/audio-processor',
                 container_name: str = 'audio-processor',
                 volume_path: str = '/app/data'):
        """
        Inicializa o processador de áudio em Docker.
        
        Args:
            image_name: Nome da imagem Docker
            container_name: Nome do container
            volume_path: Caminho do volume
        """
        self.client = docker.from_env()
        self.image_name = image_name
        self.container_name = container_name
        self.volume_path = volume_path

    def create_container(self) -> bool:
        """
        Cria o container Docker.
        
        Returns:
            bool: True se a criação foi bem-sucedida
        """
        try:
            # Verifica se o container já existe
            try:
                container = self.client.containers.get(self.container_name)
                container.remove(force=True)
            except docker.errors.NotFound:
                pass
            
            # Cria o container
            self.client.containers.run(
                self.image_name,
                name=self.container_name,
                volumes={self.volume_path: {'bind': '/app/data', 'mode': 'rw'}},
                detach=True
            )
            
            logger.info("Container criado com sucesso")
            return True
        except Exception as e:
            logger.error(f"Erro ao criar container: {str(e)}")
            return False

    def process_audio(self, audio_path: str, output_path: str) -> bool:
        """
        Processa o áudio no container.
        
        Args:
            audio_path: Caminho do arquivo de áudio
            output_path: Caminho para salvar o resultado
            
        Returns:
            bool: True se o processamento foi bem-sucedido
        """
        try:
            # Obtém o container
            container = self.client.containers.get(self.container_name)
            
            # Copia o arquivo para o container
            with open(audio_path, 'rb') as f:
                container.put_archive('/app/data', f.read())
            
            # Executa o processamento
            exit_code, output = container.exec_run(
                f'python process_audio.py /app/data/{os.path.basename(audio_path)}'
            )
            
            if exit_code == 0:
                # Copia o resultado do container
                bits, _ = container.get_archive(f'/app/data/{os.path.basename(output_path)}')
                with open(output_path, 'wb') as f:
                    for chunk in bits:
                        f.write(chunk)
                
                logger.info("Áudio processado com sucesso")
                return True
            else:
                logger.error(f"Erro no processamento: {output.decode()}")
                return False
        except Exception as e:
            logger.error(f"Erro ao processar áudio: {str(e)}")
            return False

    def monitor_resources(self) -> Dict:
        """
        Monitora os recursos do container.
        
        Returns:
            Dict: Estatísticas de recursos
        """
        try:
            container = self.client.containers.get(self.container_name)
            stats = container.stats(stream=False)
            
            return {
                'cpu_usage': stats['cpu_stats']['cpu_usage']['total_usage'],
                'memory_usage': stats['memory_stats']['usage'],
                'memory_limit': stats['memory_stats']['limit']
            }
        except Exception as e:
            logger.error(f"Erro ao monitorar recursos: {str(e)}")
            return {}

    def cleanup(self) -> bool:
        """
        Limpa os recursos do container.
        
        Returns:
            bool: True se a limpeza foi bem-sucedida
        """
        try:
            container = self.client.containers.get(self.container_name)
            container.remove(force=True)
            logger.info("Container removido com sucesso")
            return True
        except Exception as e:
            logger.error(f"Erro ao limpar recursos: {str(e)}")
            return False

    def run_processing_pipeline(self, audio_path: str, output_path: str) -> Dict:
        """
        Executa o pipeline completo de processamento.
        
        Args:
            audio_path: Caminho do arquivo de áudio
            output_path: Caminho para salvar o resultado
            
        Returns:
            Dict: Resultado do processamento
        """
        try:
            # Cria o container
            if not self.create_container():
                return {'status': 'error', 'message': 'Falha ao criar container'}
            
            # Aguarda o container iniciar
            time.sleep(5)
            
            # Processa o áudio
            if not self.process_audio(audio_path, output_path):
                return {'status': 'error', 'message': 'Falha no processamento'}
            
            # Monitora recursos
            resources = self.monitor_resources()
            
            # Limpa recursos
            self.cleanup()
            
            return {
                'status': 'success',
                'output_path': output_path,
                'resources': resources
            }
        except Exception as e:
            logger.error(f"Erro no pipeline: {str(e)}")
            return {
                'status': 'error',
                'message': str(e)
            }

