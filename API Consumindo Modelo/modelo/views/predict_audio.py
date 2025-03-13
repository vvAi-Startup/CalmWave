# modelo/views/predict_audio
import tensorflow as tf
import numpy as np
from .audio_to_spectrogram import audio_to_spectrogram
from services.insert_data_service import save_prediction_to_db
from .create_spectrogram_image import create_spectrogram_image
from .create_waveform_image import create_waveform_image
import time
import base64
import os

# Rodando o modelo toda vez que api for iniciada
model = tf.keras.models.load_model('./modelo/modelo_sirene_v1.0.1.h5')

def audio_to_base64(file_path):
    """Converte o arquivo de áudio para base64"""
    with open(file_path, "rb") as audio_file:
        return base64.b64encode(audio_file.read()).decode('utf-8')

# Função para fazer previsões com o modelo carregado
def predict_audio(file_path):
    try:
        if not file_path.lower().endswith(('.wav', '.mp3')):
            return {"error": "Arquivo não é de um formato de áudio válido."}

        start_time = time.time()

        # Salvar o áudio em um local permanente com forward slash
        audio_filename = f"audio_{int(time.time())}{os.path.splitext(file_path)[1]}"
        audio_path = f"audios/{audio_filename}"  # Usando forward slash
        
        # Copiar o arquivo de áudio para a pasta uploads/audios
        import shutil
        shutil.copy2(file_path, os.path.join('uploads', 'audios', audio_filename))

        spectrogram = audio_to_spectrogram(file_path)
        prediction = model.predict(spectrogram)

        end_time = time.time()
        tempo_resposta = end_time - start_time

        classes = ['ambulance', 'construction', 'dog', 'firetruck', 'traffic']
        predicted_class = classes[np.argmax(prediction)]

        # Criar imagens e obter caminhos
        spectrogram_path = create_spectrogram_image(file_path)
        waveform_path = create_waveform_image(file_path)
     
        if not spectrogram_path:
            return {"error": "Erro ao gerar spectrograma."}

        if not waveform_path:
            return {"error": "Erro ao gerar waveform."}

        # Converter os caminhos para usar forward slash
        spectrogram_path = spectrogram_path.replace('\\', '/')
        waveform_path = waveform_path.replace('\\', '/')

        try:
            saved_id = save_prediction_to_db(
                predicted_class,
                tempo_resposta,
                os.path.basename(file_path),
                spectrogram_path,
                waveform_path,
                audio_path
            )
            
            print(f"Predição salva no banco de dados com o ID: {saved_id}")
        except Exception as db_error:
            print(f"Erro ao salvar no banco: {db_error}")
            return {"error": str(db_error)}

        return {
            "predicted_class": predicted_class,
            "tempo_resposta": tempo_resposta,
            "saved_id": saved_id,
            "spectrogram": spectrogram_path,
            "waveform": waveform_path,
            "audio": audio_path
        }

    except Exception as e:
        print(f"Erro ao processar o áudio: {e}")
        return {"error": str(e)}
