# CalmWave API

## Visão Geral
A CalmWave API é uma aplicação backend desenvolvida em Python para processamento e análise de áudio em tempo real. A API utiliza Flask como framework web e implementa um sistema de processamento de áudio em chunks para melhor performance.

## Tecnologias Utilizadas
- **Python 3.9**: Linguagem principal
- **Flask**: Framework web
- **Librosa**: Processamento de áudio
- **NumPy**: Processamento numérico
- **Docker**: Containerização
- **JWT**: Autenticação

## Estrutura do Projeto
```
API/
├── app.py                 # Arquivo principal da API
├── auth.py               # Módulo de autenticação
├── audio_processor.py    # Processador de áudio
├── audio_processor_docker.py # Processamento em Docker
├── requirements.txt      # Dependências
└── Dockerfile           # Configuração do Docker
```

## Funcionalidades

### 1. Upload de Áudio
- Upload de áudio em chunks
- Suporte a múltiplos formatos
- Gerenciamento de sessões

### 2. Processamento de Áudio
- Processamento em tempo real
- Conversão de formatos
- Análise de áudio

### 3. Autenticação
- Autenticação via JWT
- Proteção de rotas
- Gerenciamento de sessões

### 4. Containerização
- Processamento em containers Docker
- Isolamento de recursos
- Escalabilidade

## Endpoints

### Autenticação
- `POST /auth/login`: Login de usuário
- `POST /auth/register`: Registro de usuário

### Áudio
- `POST /upload`: Upload de chunks de áudio
- `POST /upload_mp3`: Upload de arquivo MP3
- `POST /process/<session_id>`: Processamento de sessão
- `GET /status/<session_id>`: Status da sessão
- `GET /audio/<session_id>`: Recuperar áudio processado
- `GET /stream/<session_id>`: Streaming de áudio
- `GET /chunk/<session_id>/<chunk_number>`: Recuperar chunk específico
- `POST /cleanup/<session_id>`: Limpar recursos da sessão

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/calmwave.git
cd calmwave/API
```

2. Crie um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Execute a aplicação:
```bash
python app.py
```

## Docker

Para executar com Docker:

1. Construa a imagem:
```bash
docker build -t calmwave-api .
```

2. Execute o container:
```bash
docker run -p 5000:5000 calmwave-api
```

## Configuração

A API pode ser configurada através de variáveis de ambiente:

- `FLASK_APP`: Nome do arquivo principal (default: app.py)
- `FLASK_ENV`: Ambiente de execução (development/production)
- `SECRET_KEY`: Chave secreta para JWT

## Desenvolvimento

### Estrutura de Código
- **app.py**: Configuração principal da API e rotas
- **auth.py**: Implementação da autenticação
- **audio_processor.py**: Processamento de áudio
- **audio_processor_docker.py**: Processamento em containers

### Padrões de Código
- PEP 8 para estilo de código
- Docstrings para documentação
- Type hints para tipagem

## Contribuição
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença
Este projeto está licenciado sob a licença MIT - veja o arquivo LICENSE para detalhes.

## Autores
- Equipe CalmWave

## Versão
1.0.0 