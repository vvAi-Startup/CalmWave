from .predict_audio import predict_audio
import tempfile
import os

def open_file(file):
    """
    Função que recebe um arquivo de áudio enviado pelo frontend,
    faz a predição e gera as imagens do espectrograma e da forma de onda,
    e retorna os resultados em formato JSON.
    """
    try:
       # Usando o diretório temporário do sistema (Windows ou Linux)
        temp_dir = tempfile.gettempdir()  # Diretório temporário do sistema
        file_path = os.path.join(temp_dir, file.filename)
        file.save(file_path)

        # 1. Fazer a predição do áudio
        result = predict_audio(file_path)
        
        if "error" in result:
            return result

        return {
            "predicted_class": result["predicted_class"],  # Classe prevista
            "tempo_resposta": result["tempo_resposta"],    # Tempo de resposta
            "saved_id": result["saved_id"],                # ID salvo no banco
            "spectrogram_base64": result["spectrogram"],  # Spectrograma em base64
            "waveform_base64": result["waveform"],        # Forma de onda em base64
            "audio_vector": result["audio"],
        }
    
    except Exception as e:
        # Retornar erro em caso de falha
        return {"error": str(e)}
