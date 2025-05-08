# CalmWave Mobile

## Visão Geral
CalmWave Mobile é um aplicativo React Native para gravação e processamento de áudio em tempo real. O aplicativo permite aos usuários gravar áudio, visualizar ondas sonoras e enviar os dados para processamento na API.

## Tecnologias Utilizadas
- **React Native**: Framework mobile
- **TypeScript**: Linguagem de programação
- **Expo**: Plataforma de desenvolvimento
- **Styled Components**: Estilização
- **React Navigation**: Navegação
- **Expo AV**: Manipulação de áudio

## Estrutura do Projeto
```
MOBILE/
├── src/                  # Código fonte
│   ├── components/       # Componentes reutilizáveis
│   ├── screens/         # Telas do aplicativo
│   ├── context/         # Contextos React
│   └── utils/           # Utilitários
├── assets/              # Recursos estáticos
├── app.json            # Configuração do Expo
├── package.json        # Dependências
└── tsconfig.json       # Configuração TypeScript
```

## Funcionalidades

### 1. Gravação de Áudio
- Gravação em tempo real
- Visualização de ondas sonoras
- Controle de gravação (play/pause/stop)

### 2. Processamento
- Envio de áudio para API
- Processamento em chunks
- Feedback em tempo real

### 3. Interface
- Design moderno e intuitivo
- Animações suaves
- Feedback visual

### 4. Navegação
- Navegação entre telas
- Gestos e interações
- Transições fluidas

## Telas Principais

### Record
- Gravação de áudio
- Visualização de ondas
- Controles de gravação
- Timer de gravação

## Instalação

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/calmwave.git
cd calmwave/MOBILE
```

2. Instale as dependências:
```bash
npm install
```

3. Execute o aplicativo:
```bash
npm start
```

## Desenvolvimento

### Pré-requisitos
- Node.js >= 16.0.0
- npm ou yarn
- Expo CLI
- Android Studio / Xcode (para desenvolvimento nativo)

### Scripts Disponíveis
- `npm start`: Inicia o servidor de desenvolvimento
- `npm run android`: Executa no Android
- `npm run ios`: Executa no iOS
- `npm run web`: Executa na web
- `npm test`: Executa testes
- `npm run lint`: Executa linter

## Estrutura de Código

### Componentes
- Componentes reutilizáveis
- Estilização com Styled Components
- Props tipadas com TypeScript

### Telas
- Organização por funcionalidade
- Navegação entre telas
- Gerenciamento de estado

### Contextos
- Gerenciamento de estado global
- Autenticação
- Configurações

## Configuração

O aplicativo pode ser configurado através do arquivo `app.json`:

```json
{
  "expo": {
    "name": "CalmWave",
    "slug": "calmwave",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

## Padrões de Código
- ESLint para linting
- Prettier para formatação
- TypeScript para tipagem
- Componentes funcionais
- Hooks React

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
