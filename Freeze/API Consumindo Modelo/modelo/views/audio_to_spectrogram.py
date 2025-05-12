#modelo/views/audio_to_espectogram
import numpy as np
import librosa

# Função para carregar e processar o arquivo de áudio
def audio_to_spectrogram(file_path, max_length=128):
    y, sr = librosa.load(file_path, sr=None)
    spectrogram = librosa.feature.melspectrogram(y=y, sr=sr)
    
    # Padronizar o comprimento do espectrograma
    if spectrogram.shape[1] > max_length:
        spectrogram = spectrogram[:, :max_length]
    else:
        padding = max_length - spectrogram.shape[1]
        spectrogram = np.pad(spectrogram, ((0, 0), (0, padding)), mode='constant')
    
    # Adicionar dimensão para o canal
    spectrogram = spectrogram[np.newaxis, ..., np.newaxis]
    
    # Normalizar o espectrograma
    spectrogram = (spectrogram - np.mean(spectrogram)) / np.std(spectrogram)
    
    return spectrogram