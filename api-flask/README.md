# CalmWave API

API Flask para processamento de áudio com serviço de denoising.

## Requisitos

- Python 3.9+
- Docker e Docker Compose
- FFmpeg

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/calmwave.git
cd calmwave/api-flask
```

2. Crie um arquivo `.env` baseado no `.env.example`:
```bash
cp .env.example .env
```

3. Construa e inicie os containers:
```bash
docker-compose up --build
```

## Estrutura do Projeto

```
api-flask/
├── app/
│   ├── models/
│   │   ├── audio_model.py
│   │   └── user_model.py
│   ├── resources/
│   │   ├── audio_resource.py
│   │   └── auth_resource.py
│   ├── services/
│   │   ├── audio_service.py
│   │   └── auth_service.py
│   ├── __init__.py
│   ├── config.py
│   └── extensions.py
├── uploads/
├── processed/
├── temp_wavs/
├── logs/
├── docker-compose.yml
├── Dockerfile
├── requirements.txt
└── run.py
```

## Endpoints

### Autenticação

- `POST /auth/register` - Registra um novo usuário
- `POST /auth/login` - Autentica um usuário
- `GET /auth/me` - Retorna informações do usuário atual

### Áudio

- `POST /audio/upload` - Faz upload de um arquivo de áudio
- `GET /audio/list` - Lista todos os áudios processados
- `GET /audio/<upload_id>` - Retorna informações de um áudio específico
- `DELETE /audio/<upload_id>` - Remove um áudio

## Configuração

As configurações podem ser ajustadas através do arquivo `.env` ou variáveis de ambiente:

- `FLASK_APP`: Nome do arquivo principal da aplicação
- `FLASK_ENV`: Ambiente de execução (development/production)
- `FLASK_DEBUG`: Habilita/desabilita modo debug
- `SECRET_KEY`: Chave secreta para sessões
- `MONGO_URI`: URI de conexão com o MongoDB
- `MONGO_DATABASE`: Nome do banco de dados
- `DENOISE_SERVER`: URL do serviço de denoising
- `DENOISE_TIMEOUT`: Timeout para requisições ao serviço de denoising
- `BASE_URL`: URL base da API

## Desenvolvimento

1. Instale as dependências:
```bash
pip install -r requirements.txt
```

2. Execute a aplicação:
```bash
python run.py
```

## Testes

```bash
pytest
```

## Licença

MIT 