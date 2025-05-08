# Imagem base
FROM python:3.9-slim

# Instalação do FFmpeg
RUN apt-get update && apt-get install -y \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Configuração do workspace
WORKDIR /app

# Cópia dos arquivos de requisitos
COPY requirements.txt .

# Instalação das dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Cópia do código fonte
COPY . .

# Criação dos diretórios necessários
RUN mkdir -p uploads processed

# Configuração das variáveis de ambiente
ENV PYTHONUNBUFFERED=1
ENV FLASK_APP=app.py
ENV FLASK_ENV=production

# Exposição da porta
EXPOSE 5000

# Comando de inicialização
CMD ["python", "app.py"]
