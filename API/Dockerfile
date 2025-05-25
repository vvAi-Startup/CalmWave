from python:3.9-slim

run apt-get update && apt-get install -y \ 
    ffmpeg \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

workdir /app

copy requirements.txt .

run pip install --no-cache-dir -r requirements.txt

copy . .

run mkdir -p uploads processed

ENV PYTHONUNBUFFERED=1 \
 FLASK_APP=app.py \
 FLASK_RUN_HOST=0.0.0.0\
 FLASK_ENV=production

expose 5000

cmd ["python", "app.py"]