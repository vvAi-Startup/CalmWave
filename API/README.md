# CalmWave API

## Descrição
API principal do CalmWave, responsável pelo gerenciamento de usuários, sessões de áudio e processamento de requisições. Integra-se com os componentes de IA para fornecer processamento de áudio em tempo real.

## Funcionalidades
- Autenticação de usuários
- Gerenciamento de sessões
- Upload e processamento de áudio
- Streaming de áudio
- Integração com modelos de IA
- Gerenciamento de playlists

## Tecnologias
![Python](https://img.shields.io/badge/-Python-0D1117?style=for-the-badge&logo=python&labelColor=0D1117&textColor=0D1117)&nbsp;
![Flask](https://img.shields.io/badge/-Flask-0D1117?style=for-the-badge&logo=flask&labelColor=0D1117&textColor=0D1117)&nbsp;


## Endpoints

### Autenticação
- `POST /auth/login` - Login de usuário
- `POST /auth/register` - Registro de usuário

### Áudio
- `POST /audio/process` - Processamento de áudio
- `GET /audio/stream` - Streaming de áudio
- `GET /audio/history` - Histórico de áudio

### Playlist
- `GET /playlist` - Listar playlists
- `POST /playlist` - Criar playlist
- `PUT /playlist/:id` - Atualizar playlist

## Como Usar

1. Crie um ambiente virtual:
    ```bash
    python -m venv venv
    venv\Scripts\activate
    ```

2. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```


3. Execute a API:
   ```bash
   python app.py
   ```

## Estrutura do Projeto
```
API/
├── app.py            # Aplicação principal
├── auth.py           # Autenticação
├── audio_processor.py # Processamento de áudio
├── requirements.txt  # Dependências
```

## Licença
Este projeto está licenciado sob a licença MIT.

## Autores
- Equipe CalmWave

## Versão
1.0.0 