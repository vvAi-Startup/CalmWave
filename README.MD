# CalmWave — Apresentação Institucional

<div align="center">
<img width="100" height="100" alt="Fones_e_Onda_Minimalista__1_-removebg-preview 3" src="https://github.com/user-attachments/assets/7f120e2f-6f50-4972-a1b0-bdc9f3911c1c" />
</div>

**Reduzindo o ruído para um aprendizado sem barreiras.**

Este repositório reúne o ecossistema CalmWave: aplicativo mobile, back-end, dashboard e landing page, com foco em inclusão educacional para estudantes com Transtorno do Processamento Auditivo Central (TPAC) e hipersensibilidade auditiva.

## Visão Geral

O CalmWave é uma solução de acessibilidade auditiva baseada em inteligência artificial. O objetivo é reduzir ruídos de fundo em tempo real, preservando a fala do professor e melhorando a compreensão em sala de aula.

## Problema que Resolvemos

Em ambientes com alta poluição sonora, estudantes com TPAC enfrentam sobrecarga sensorial, baixa concentração e queda de desempenho. A ausência de tecnologia assistiva acessível agrava a exclusão educacional.

## Solução e Diferenciais

- IA em tempo real para redução de ruído e destaque da fala.
- Processamento offline com modelos ONNX, priorizando privacidade e baixa latência.
- Interface inclusiva e fluxo simples para uso em sala de aula.
- Independência de rede, ideal para escolas com infraestrutura limitada.

Indicadores-alvo do produto:

- Precisão: 98%
- Latência: <50ms
- Foco: acessibilidade em áudio ao vivo

## Como Funciona

1. Captação do áudio ambiente via microfone.
2. Segmentação em blocos de baixa latência.
3. Inferência local com modelos ONNX.
4. Redução de ruído e preservação da fala.
5. Entrega do áudio limpo em tempo real.

## Arquitetura do Repositório

- [Aplicativo Mobile (Android)](./Mobile_CalmWave): app do usuário final com IA offline.
- [Dashboard Web e API Back-End](./ADM_CalmWave): API em Flask + painel analítico em Next.js.
- [Landing Page](./CalmWave_LandingPage): apresentação institucional do produto.
- [Site Institucional da Equipe](./vvai-team): portfólio e posicionamento da equipe.

## Tecnologias Utilizadas

- Mobile (Android): Kotlin, Jetpack Compose, ONNX Runtime e WorkManager.
- Back-End API: Python (Flask), PyTorch/torchaudio e Supabase (PostgreSQL).
- Front-End Web: Next.js, React e Tailwind CSS.

## Documentação

- [Documentação do App Mobile](./Mobile_CalmWave/README.md)
  - [Fluxo de Gravação de Áudio](./Mobile_CalmWave/fluxo_gravacao_audio.md)
  - [Funcionamento do Denoising via ONNX](./Mobile_CalmWave/funcionamento_onnx_denoiser.md)
  - [Comparação de Espectrogramas](./Mobile_CalmWave/espectrograma_offline.md)
- [Documentação do Backend e Web Dashboard](./ADM_CalmWave/README.md)
  - [Implementação de Banco de Dados e Analytics](./ADM_CalmWave/doc.md)

## Próximos Passos

- Validar a solução em escolas parceiras
- Publicar estudos de caso com resultados mensuráveis
- Evoluir modelos para diferentes perfis de ruído
- Ampliar parcerias com instituições de inclusão

## Nossa Equipe

Equipe multidisciplinar focada em IA, mobile, dados e produto, com atuação em acessibilidade educacional.

## Contato

Se você é investidor, parceiro ou avaliador acadêmico e deseja aprofundar a conversa, entre em contato com a equipe pela página institucional.

## Como Contribuir

Se você deseja colaborar com o projeto:

- Desenvolvimento Mobile: explore a pasta `Mobile_CalmWave`.
- Desenvolvimento Web/API: explore a pasta `ADM_CalmWave`.
- Otimização de IA: contribuições com modelos ONNX e técnicas de áudio são bem-vindas.
- Feedback: abra issues com melhorias e sugestões.

## Agradecimentos

Agradecemos a todos que apoiam o desenvolvimento do CalmWave. Com o seu suporte, transformamos tecnologia em inclusão para a educação.
