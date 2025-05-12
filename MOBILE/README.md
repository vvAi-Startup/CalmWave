# CalmWave Mobile

## Descrição
Aplicativo mobile do CalmWave, desenvolvido para facilitar a interação entre professores e estudantes com TPAC (Transtorno do Processamento Auditivo Central). O aplicativo permite a captura, processamento e transmissão de áudio em tempo real.

## Funcionalidades
- Captura de áudio via microfone
- Interface para professores:
  - Controles de gravação
  - Configurações de áudio
  - Monitoramento de conexão
- Interface para estudantes:
  - Recebimento de áudio processado
  - Controles de reprodução
  - Ajustes de volume e equalização

## Tecnologias
![React Native](https://img.shields.io/badge/-React%20Native-0D1117?style=for-the-badge&logo=react&labelColor=0D1117&textColor=0D1117)&nbsp;
![TypeScript](https://img.shields.io/badge/-TypeScript-0D1117?style=for-the-badge&logo=typescript&labelColor=0D1117&textColor=0D1117)&nbsp;
![Redux](https://img.shields.io/badge/-Redux-0D1117?style=for-the-badge&logo=redux&labelColor=0D1117&textColor=0D1117)&nbsp;

## Como Usar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o aplicativo:
   ```bash
   # Android
   npm run android

   # iOS
   npm run ios
   ```

## Estrutura do Projeto
```
MOBILE/
├── app/              # Configurações do app
├── assets/           # Recursos estáticos
├── components/       # Componentes React Native
├── context/          # Contextos React
├── screens/          # Telas do aplicativo
├── services/         # Serviços
├── src/              # Código fonte
└── utils/            # Funções utilitárias
```

## Contribuição
1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença
Este projeto está licenciado sob a licença MIT.
