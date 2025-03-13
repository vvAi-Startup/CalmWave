from models.ia_data import IAData
import hashlib
import time
import os

def generate_encrypted_filename(original_name):
    """Gera um nome de arquivo encriptado baseado no nome original e timestamp"""
    timestamp = str(time.time())
    string_to_hash = original_name + timestamp
    return hashlib.md5(string_to_hash.encode()).hexdigest()

def save_prediction_to_db(tipo_ruido, tempo_resposta, nome_audio, spectrogram_path, waveform_path, audio_path):
    """Função para salvar a predição da IA no banco de dados."""
    try:
        # Verifica se os arquivos existem
        for path in [spectrogram_path, waveform_path, audio_path]:
            if path:
                full_path = os.path.join('uploads', path)
                if not os.path.exists(full_path):
                    print(f"AVISO: Arquivo não encontrado: {full_path}")
        
        # Extrai apenas o nome do arquivo do caminho completo
        nome_audio_final = os.path.basename(nome_audio)
        
        ia_data = IAData(
            tipo_ruido=tipo_ruido, 
            tempo_resposta=tempo_resposta, 
            nome_audio=nome_audio_final,
            spectrograma_cripto=spectrogram_path,
            waveform_cripto=waveform_path,
            vetor_audio=audio_path
        )
        ia_data.save()
        saved_id = str(ia_data.id)
        print(f"Dados salvos com sucesso! ID:{saved_id}")
        return saved_id
    except Exception as e:
        print(f"Erro ao salvar os dados no banco: {e}")
        raise e
