FROM python:3.9-slim

WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de requisitos
COPY requirements.txt .

# Instala as dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código da aplicação
COPY . .

# Cria diretórios necessários
RUN mkdir -p uploads processed temp_wavs logs

# Expõe a porta da aplicação
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["python", "run.py"]