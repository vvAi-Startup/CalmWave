#modelo/views/create_waveform_image
import librosa
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Definir backend não-interativo
import matplotlib.pyplot as plt
import os
import time
# Função para criar e salvar a imagem da forma de onda do áudio
def create_waveform_image(file_path, output_dir='waveforms'):
    try:
        # Gerar nome único para o arquivo
        base_filename = os.path.splitext(os.path.basename(file_path))[0]
        unique_filename = f"{base_filename}_{int(time.time())}.png"
        output_path = f"{output_dir}/{unique_filename}"
        
        y, sr = librosa.load(file_path, sr=None)
        plt.figure(figsize=(6, 2))
        plt.plot(np.linspace(0, len(y) / sr, num=len(y)), y)
        plt.title('Forma de Onda do Áudio')
        plt.xlabel('Tempo (s)')
        plt.ylabel('Amplitude')
        plt.grid()
        
        # Salvar a imagem
        plt.savefig(os.path.join('uploads', output_path), format='png', bbox_inches='tight', pad_inches=0)
        plt.close('all')  # Fechar todas as figuras

        return output_path

    except Exception as e:
        print(f"Erro ao criar forma de onda: {e}")
        return None