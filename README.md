# CalmWave

## Resumo do Projeto
Este artigo propõe o desenvolvimento de um software para filtragem e processamento de áudio, com o objetivo de auxiliar indivíduos com Transtorno do Processamento Auditivo Central (TPAC). A falta de tecnologias personalizadas e acessíveis para TPAC impacta negativamente no desempenho acadêmico, profissional e social dos indivíduos afetados. Alinhado com a Meta 3 dos ODS da ONU (Saúde e Bem-Estar), o projeto visa criar uma solução que melhore a qualidade de vida, proporcionando um ambiente auditivo mais claro e controlado.

### Contexto
A dificuldade de acesso a tecnologias personalizadas para TPAC continua sendo um desafio significativo. Embora existam recursos como aparelhos sonoros e treinamentos auditivos, a acessibilidade e a capacidade de personalização ainda são limitadas. Além disso, o custo elevado de muitas soluções restringe o acesso a uma parcela considerável da população.

### Objetivo Geral
Desenvolver, avaliar e aprimorar a eficácia de um software adaptativo para a filtragem e o processamento de áudio, com o objetivo de reduzir o estresse sonoro e melhorar a compreensão em crianças com TPAC em ambientes de aprendizado.

### Objetivos Específicos
- Identificar as principais fontes de ruído que causam estresse e dificultam a compreensão
- Desenvolver um protótipo de software para filtragem e limpeza do áudio ambiente
- Implementar funcionalidades de controle de reprodução e ajuste de velocidade
- Realizar testes técnicos e de usabilidade
- Conduzir experimentos em contextos de aprendizado
- Avaliar a melhora na compreensão e concentração
- Coletar feedback dos usuários e educadores
- Explorar estratégias de integração pedagógica


## Metodologia
1. **Gravação do Áudio (Professor):**
   - Um professor utiliza um microfone para gravar sua voz
   - Transmissão sem fio (Bluetooth) para dispositivo central (smartphone/tablet)

2. **Processamento Inicial no Dispositivo Central:**
   - Recebimento do áudio gravado
   - Interação com API para envio do áudio segmentado

3. **Análise de Áudios (Inteligência Artificial):**
   - Envio dos segmentos para sistema de análise de áudio
   - Filtragem do áudio e aprimoramento da fala

4. **Mesclagem de Áudios e Retorno Parcial:**
   - Retorno do áudio tratado para API
   - Mesclagem do áudio e retorno dos segmentos tratados

5. **Retorno do Áudio Limpo (Estudante):**
   - Transmissão do áudio processado para o estudante
   - Recebimento via fones de ouvido com streaming

## Estrutura do Projeto

### Diretórios Ativos

#### API Consumindo Modelo
- API em Flask para processamento de áudio
- Integração com modelos de IA
- Processamento em tempo real

#### MOBILE
- Aplicação mobile em desenvolvimento
- Interface para professores e estudantes
- Gerenciamento de áudio e configurações

#### IA
- Componentes de Inteligência Artificial
- Modelos de processamento de áudio
- Algoritmos de filtragem e realce

### Diretório Freeze
Contém códigos e protótipos desenvolvidos anteriormente, mantidos para referência histórica.

## Tecnologias Principais

### Backend
![Python](https://img.shields.io/badge/-Python-0D1117?style=for-the-badge&logo=python&labelColor=0D1117&textColor=0D1117)&nbsp;
![Flask](https://img.shields.io/badge/-Flask-0D1117?style=for-the-badge&logo=flask&labelColor=0D1117&textColor=0D1117)&nbsp;

### Frontend
![React Native](https://img.shields.io/badge/-React%20Native-0D1117?style=for-the-badge&logo=react&labelColor=0D1117&textColor=0D1117)&nbsp;
![TypeScript](https://img.shields.io/badge/-TypeScript-0D1117?style=for-the-badge&logo=typescript&labelColor=0D1117&textColor=0D1117)&nbsp;

### Infraestrutura
![Docker](https://img.shields.io/badge/-Docker-0D1117?style=for-the-badge&logo=docker&labelColor=0D1117&textColor=0D1117)&nbsp;

## Como Usar

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/CalmWave.git
   cd CalmWave
   ```

2. Configure o ambiente:
   ```bash
    # Inicie o ambiente virtual
    python -m venv venv
    venv\Scripts\activate

   # Instale as dependências do Python
   pip install -r requirements.txt

   # Instale as dependências do Node.js
   npm install
   ```

3. Execute os serviços:
   ```bash
   # API Principal
   cd API
   python app.py

   # Frontend
   cd MOBILE
   npm start
   ```


## Licença
Este projeto está licenciado sob a licença MIT.

## Autores
- Equipe CalmWave