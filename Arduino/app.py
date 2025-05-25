import serial
import serial.tools.list_ports
import sounddevice as sd
import numpy as np
import scipy.io.wavfile as wav
import requests
import time
import sys
import threading
import os

# --- Configurações Globais ---
AUDIO_FILENAME = 'gravacao.wav' # Nome do arquivo WAV para salvar a gravação
API_URL = 'http://localhost:5000/upload' # URL do seu servidor API Flask
BAUDRATE = 9600 # Taxa de comunicação serial com o Arduino

# --- Variáveis de Estado (Compartilhadas de forma segura entre threads) ---
# recording_event: Sinaliza para o callback de áudio se deve gravar.
# stop_app_event: Sinaliza para todas as threads encerrarem o aplicativo.
recording_event = threading.Event()
stop_app_event = threading.Event()

audio_data_buffer = []      # Buffer para armazenar os dados de áudio
current_samplerate = 0      # Taxa de amostragem real do stream de áudio
arduino_serial_port = None  # Objeto da porta serial do Arduino

# --- Funções de Detecção e Abertura de Dispositivos ---

def find_arduino_port():
    """
    Tenta encontrar a porta serial do Arduino.
    Retorna a porta (ex: 'COM3') ou None se não encontrar.
    """
    print("PYTHON: Buscando por Arduino...")
    ports = list(serial.tools.list_ports.comports())
    for port in ports:
        # Padrões comuns para Arduinos, clones (CH340), e conversores USB-Serial
        if "Arduino" in port.description or "CH340" in port.description or \
           "USB Serial" in port.description or "VID:PID=2341" in port.hwid or \
           "CP210x" in port.description or "FTDI" in port.description:
            print(f"PYTHON: Arduino encontrado na porta: {port.device} - {port.description}")
            return port.device
    print("PYTHON: Nenhum Arduino encontrado.")
    return None

def find_and_open_audio_stream(callback):
    """
    Tenta abrir um stream de entrada de áudio dinamicamente, iterando
    sobre dispositivos disponíveis e taxas de amostragem comuns.
    Retorna um objeto sd.InputStream em caso de sucesso.
    """
    print("PYTHON: Tentando abrir o stream de entrada de áudio dinamicamente...")

    devices = sd.query_devices()
    input_devices = [i for i, device in enumerate(devices) if device['max_input_channels'] > 0]

    if not input_devices:
        raise Exception("PYTHON: Nenhum dispositivo de entrada de áudio encontrado.")

    # Prioriza o dispositivo de entrada padrão se houver
    default_input_device_index = None
    try:
        default_input_device_info = sd.query_devices(kind='input')
        if default_input_device_info:
            for i, device in enumerate(devices):
                if device['name'] == default_input_device_info['name'] and device['max_input_channels'] > 0:
                    default_input_device_index = i
                    break
    except sd.PortAudioError:
        print("PYTHON: Nao foi possivel consultar o dispositivo de entrada padrao. Tentando outros...")
        # Continua sem dispositivo padrao

    # Taxas de amostragem comuns para tentar
    common_sample_rates = [44100, 48000, 22050, 16000]

    # Lista de dispositivos para tentar, começando pelo padrão, depois os outros
    devices_to_try = []
    if default_input_device_index is not None:
        devices_to_try.append(default_input_device_index)
    devices_to_try.extend([idx for idx in input_devices if idx != default_input_device_index])

    for device_id in devices_to_try:
        device_info = sd.query_devices(device_id)
        max_input_channels = device_info['max_input_channels']
        device_name = device_info['name']

        # Tenta mono e estéreo se o dispositivo suportar
        channels_to_try = [1]
        if max_input_channels >= 2:
            channels_to_try.append(2)

        for sr in common_sample_rates:
            for ch in channels_to_try:
                if ch <= max_input_channels:
                    try:
                        print(f"PYTHON: Tentando dispositivo: '{device_name}' (ID: {device_id}) | Taxa: {sr} Hz | Canais: {ch}")
                        stream = sd.InputStream(device=device_id, channels=ch, samplerate=sr, callback=callback, blocksize=1024)
                        print(f"PYTHON: Stream aberto com sucesso em: '{device_name}' | Taxa: {sr} Hz | Canais: {ch}")
                        return stream
                    except sd.PortAudioError as e:
                        print(f"PYTHON:   Falha nesta combinacao ({device_name}, {sr}Hz, {ch}ch): {e}")
                    except Exception as e:
                        print(f"PYTHON:   Erro inesperado ao abrir stream para '{device_name}': {e}")

    raise Exception("PYTHON: Nao foi possivel abrir um stream de entrada de audio com as configuracoes disponiveis. Verifique drivers e permissoes do microfone.")

# --- Callback de Gravação de Áudio ---
def record_callback(indata, frames, time_info, status):
    """
    Função chamada pelo sounddevice para cada bloco de dados de áudio.
    Esta função é executada em uma thread separada pelo sounddevice.
    """
    global audio_data_buffer
    if status:
        print(f"PYTHON: Aviso no stream de audio: {status}", file=sys.stderr)
    # A gravação só ocorre se o 'recording_event' estiver setado (ativo).
    if recording_event.is_set():
        audio_data_buffer.append(indata.copy())

# --- Funções de Comunicação Serial com Arduino ---
def send_arduino_command(command):
    """Envia um comando para o Arduino via porta serial."""
    global arduino_serial_port
    if arduino_serial_port and arduino_serial_port.is_open:
        try:
            # Adiciona uma quebra de linha para que o Arduino saiba onde o comando termina.
            arduino_serial_port.write(f"{command}\n".encode('utf-8'))
            # print(f"PYTHON: Comando '{command}' enviado ao Arduino.") # Comentar para evitar spam no console
        except serial.SerialException as se:
            print(f"PYTHON: ERRO CRITICO ao enviar '{command}' para Arduino: {se}")
            stop_app_event.set() # Sinaliza para a thread principal parar se a serial falhar
        except Exception as e:
            print(f"PYTHON: Erro inesperado ao enviar '{command}' para Arduino: {e}")
    else:
        print(f"PYTHON: Aviso: Nao foi possivel enviar comando '{command}': Porta serial do Arduino nao esta aberta.")

# --- Thread para Leitura Serial do Arduino ---
def arduino_serial_reader_thread_func():
    """
    Função para ler a porta serial do Arduino em uma thread separada.
    Isso evita bloquear o loop principal enquanto espera dados do Arduino.
    """
    global arduino_serial_port, audio_data_buffer, current_samplerate

    while not stop_app_event.is_set(): # Continua rodando até o evento de parada ser setado
        if arduino_serial_port and arduino_serial_port.in_waiting > 0:
            try:
                cmd = arduino_serial_port.readline().decode('utf-8', errors='ignore').strip()
                if cmd:
                    print(f"PYTHON: Comando recebido do Arduino: '{cmd}'")

                    if cmd == 'START':
                        if not recording_event.is_set(): # Inicia gravação apenas se não estiver gravando
                            print("PYTHON: Recebido START. Iniciando gravacao de audio...")
                            audio_data_buffer = [] # Limpa dados de áudio anteriores
                            recording_event.set() # Sinaliza para o callback de áudio começar a gravar
                    elif cmd == 'STOP':
                        if recording_event.is_set(): # Para gravação apenas se estiver gravando
                            print("PYTHON: Recebido STOP. Parando gravacao de audio...")
                            recording_event.clear() # Sinaliza para o callback de áudio parar

                            if audio_data_buffer:
                                # Concatena todos os blocos de áudio gravados
                                audio_np = np.concatenate(audio_data_buffer)
                                # Normaliza a amplitude para evitar clipping e garantir compatibilidade .wav
                                # Converte para float32, que é o formato comum para soundfile/scipy.io.wavfile
                                if audio_np.dtype != np.float32:
                                     audio_np = audio_np.astype(np.float32) / np.iinfo(audio_np.dtype).max
                                # Reduz a amplitude para evitar clipping e garantir compatibilidade .wav (mesmo para float)
                                audio_np_normalized = audio_np / np.max(np.abs(audio_np)) if np.max(np.abs(audio_np)) > 0 else audio_np

                                # Garante que o diretório de destino exista
                                os.makedirs(os.path.dirname(AUDIO_FILENAME) or '.', exist_ok=True)
                                wav.write(AUDIO_FILENAME, int(current_samplerate), audio_np_normalized)

                                print(f"PYTHON: Arquivo de audio salvo como '{AUDIO_FILENAME}'. Enviando para API...")

                                # Envia comando 'SENDING' para Arduino ANTES de enviar para a API
                                send_arduino_command('SENDING')

                                # Enviar para a API
                                try:
                                    with open(AUDIO_FILENAME, 'rb') as f:
                                        # Adicionado timeout para evitar bloqueio eterno
                                        response = requests.post(API_URL, files={'file': f}, timeout=60) # 60 segundos de timeout
                                    print(f"PYTHON: API respondeu: {response.status_code} - {response.text}")
                                except requests.exceptions.ConnectionError:
                                    print(f"PYTHON: Erro ao enviar para API: Nao foi possivel conectar ao servidor em {API_URL}. Certifique-se de que o servidor esta rodando.")
                                except requests.exceptions.Timeout:
                                    print(f"PYTHON: Erro ao enviar para API: Tempo limite excedido ao conectar ou aguardar resposta do servidor.")
                                except Exception as e:
                                    print(f"PYTHON: Erro inesperado ao enviar para API: {e}")
                                finally:
                                    # Sinaliza ao Arduino que o envio terminou (independentemente do sucesso/falha)
                                    send_arduino_command('SENT_COMPLETE')
                            else:
                                print("PYTHON: Nenhum dado de audio gravado apos STOP. Nao havera envio para API.")

            except serial.SerialException as se:
                print(f"PYTHON: Erro de comunicacao serial na thread de leitura: {se}")
                stop_app_event.set() # Sinaliza para sair do loop principal
            except UnicodeDecodeError:
                print("PYTHON: Erro de decodificacao na serial (pode ser lixo). Ignorando esta linha.")
            except Exception as e:
                print(f"PYTHON: Erro inesperado na thread de leitura serial: {e}")
        time.sleep(0.01) # Pequeno atraso para evitar consumo excessivo de CPU

# --- Lógica Principal do Aplicativo ---

if __name__ == '__main__':
    audio_stream = None
    serial_reader_thread = None

    try:
        # --- Conexão com o Arduino ---
        port_name = find_arduino_port()
        if not port_name:
            print("PYTHON: Nao foi possivel encontrar o Arduino. Encerrando o aplicativo.")
            sys.exit(1)

        try:
            arduino_serial_port = serial.Serial(port_name, BAUDRATE, timeout=0.1)
            print(f"PYTHON: Conectado ao Arduino na porta {port_name}.")
            # Pequeno atraso para o Arduino inicializar e para a comunicação serial estabilizar.
            time.sleep(2)
            # Limpa qualquer dado serial pendente na inicialização (lixo de bootloader, etc.)
            arduino_serial_port.flushInput()
            arduino_serial_port.flushOutput()
            print("PYTHON: Buffers serial limpos.")

            # Inicia a thread para ler do Arduino.
            serial_reader_thread = threading.Thread(target=arduino_serial_reader_thread_func, daemon=True)
            serial_reader_thread.start()
            print("PYTHON: Thread de leitura serial do Arduino iniciada.")

        except serial.SerialException as e:
            print(f"PYTHON: Erro ao conectar ou configurar o Arduino: {e}")
            print("PYTHON: Verifique se a porta COM esta correta e nao esta em uso por outro programa (ex: Monitor Serial do Arduino IDE).")
            sys.exit(1)

        # --- Abertura do Stream de Áudio ---
        try:
            audio_stream = find_and_open_audio_stream(record_callback)
            current_samplerate = audio_stream.samplerate # Armazena a taxa de amostragem real utilizada
            audio_stream.start() # Inicia o stream de áudio (ele vai chamar o callback, mas só grava se 'recording_event' estiver set)
            print(f"PYTHON: Stream de audio iniciado com {current_samplerate} Hz. Aguardando comandos do Arduino...")

            # --- Loop Principal: Mantém o programa rodando e a thread de leitura ativa ---
            # O loop principal agora apenas espera um sinal para parar o aplicativo.
            stop_app_event.wait() # Bloqueia até que um evento sinalize para parar

        except Exception as main_e:
            print(f"PYTHON: Erro critico na inicializacao do stream de audio: {main_e}")
            # Se ocorrer um erro aqui, sinaliza para a thread de leitura parar também.
            stop_app_event.set()

    finally:
        print("PYTHON: Finalizando o aplicativo...")
        # Garante que o evento de parada esteja setado para encerrar threads.
        stop_app_event.set()

        if serial_reader_thread and serial_reader_thread.is_alive():
            print("PYTHON: Aguardando thread de leitura serial finalizar...")
            serial_reader_thread.join(timeout=2) # Espera a thread de leitura terminar (com timeout)
            if serial_reader_thread.is_alive():
                print("PYTHON: Aviso: Thread de leitura serial nao terminou em tempo.")

        if audio_stream and audio_stream.active:
            print("PYTHON: Parando e fechando o stream de audio...")
            audio_stream.stop()
            audio_stream.close()
            print("PYTHON: Stream de audio fechado.")

        if arduino_serial_port and arduino_serial_port.is_open:
            print("PYTHON: Fechando a porta serial do Arduino...")
            arduino_serial_port.close()
            print("PYTHON: Porta serial do Arduino fechada.")

        print("PYTHON: Aplicativo encerrado.")
        sys.exit(0) # Saída limpa