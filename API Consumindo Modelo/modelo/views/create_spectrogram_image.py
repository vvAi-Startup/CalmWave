# modelo/views/create_espectrogram_image
import librosa
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Definir backend não-interativo
import matplotlib.pyplot as plt
import os
import time

# Função para criar e salvar a imagem do espectrograma


def create_spectrogram_image(file_path, output_dir='spectrograms'):

    try:
        # Gerar nome único para o arquivo
        base_filename = os.path.splitext(os.path.basename(file_path))[0]
        unique_filename = f"{base_filename}_{int(time.time())}.png"
        output_path = f"{output_dir}/{unique_filename}"

        y, sr = librosa.load(file_path, sr=None)
        spectrogram = librosa.feature.melspectrogram(y=y, sr=sr)

        # Padronizar o comprimento do espectrograma
        if spectrogram.shape[1] > 128:
            spectrogram = spectrogram[:, :128]
        else:
            padding = 128 - spectrogram.shape[1]
            spectrogram = np.pad(
                spectrogram, ((0, 0), (0, padding)), mode='constant')

        # Criar a imagem do espectrograma
        plt.figure(figsize=(6, 3))
        plt.imshow(librosa.power_to_db(spectrogram, ref=np.max),
                aspect='auto', cmap='inferno')
        plt.axis('off')

        # Salvar a imagem
        plt.savefig(os.path.join('uploads', output_path), format='png', bbox_inches='tight', pad_inches=0)
        plt.close('all')  # Fechar todas as figuras

        return output_path

    except Exception as e:
        print(f"Erro ao criar espectrograma: {e}")
        return None
