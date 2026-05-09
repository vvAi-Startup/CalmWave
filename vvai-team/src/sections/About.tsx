import { useEffect, useRef, useState } from 'react';
import LOGO_SOBRE from '../assets/LOGO-SOBRE.png';

// Dados das anotações — cada uma tem posição do ponto na logo, posição do label, e texto
const annotations = [
  {
    id: 'montanhas',
    // Ponto de origem (sobre a logo) — topo, ondulações
    dotX: 50,
    dotY: 18,
    // Posição do label (relativa ao container)
    labelX: 50,
    labelY: -2,
    title: 'Cadeias Montanhosas',
    description: 'As ondulações no topo referenciam as cadeias montanhosas da região, conectando a identidade da empresa à sua origem geográfica.',
    align: 'center' as const,
  },
  {
    id: 'neural',
    // Ponto de origem — malha inferior
    dotX: 25,
    dotY: 75,
    // Label embaixo à esquerda
    labelX: -5,
    labelY: 95,
    title: 'Rede Neural',
    description: 'A malha geométrica inferior simula conexões neurais, representando a inteligência artificial como base tecnológica da empresa.',
    align: 'left' as const,
  },
  {
    id: 'joia',
    // Ponto de origem — ponta inferior (vértice da joia)
    dotX: 75,
    dotY: 70,
    // Label embaixo à direita
    labelX: 105,
    labelY: 95,
    title: 'Joia Bruta',
    description: 'O formato lapidado simboliza dados brutos transformados em insights valiosos — a essência do trabalho da vvAi.',
    align: 'right' as const,
  },
];

// Componente de ponto pulsante SVG
function PulsingDot({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g>
      {/* Anel externo pulsante */}
      <circle cx={cx} cy={cy} r="12" fill="none" stroke="#AE42EF" strokeWidth="1.5" opacity="0.4">
        <animate attributeName="r" values="8;16;8" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;0;0.6" dur="2.5s" repeatCount="indefinite" />
      </circle>
      {/* Anel médio pulsante (delay) */}
      <circle cx={cx} cy={cy} r="6" fill="none" stroke="#8754F2" strokeWidth="1" opacity="0.3">
        <animate attributeName="r" values="6;12;6" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.5;0;0.5" dur="2.5s" begin="0.8s" repeatCount="indefinite" />
      </circle>
      {/* Ponto central sólido */}
      <circle cx={cx} cy={cy} r="4" fill="url(#dotGradient)" />
      {/* Brilho interno */}
      <circle cx={cx} cy={cy} r="2" fill="white" opacity="0.8" />
    </g>
  );
}

// Componente da visualização da logo com anotações
function LogoAnnotated() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef}
      className="relative flex justify-center items-center w-full"
      style={{ minHeight: '550px' }}
    >
      {/* Glow de fundo */}
      <div className="absolute w-64 h-64 md:w-80 md:h-80 bg-gradient-to-tr from-vvai-purple to-vvai-highlight rounded-full blur-[80px] opacity-15 animate-pulse"></div>

      {/* Container principal com SVG overlay */}
      <div className="relative w-full max-w-lg" style={{ aspectRatio: '1 / 1' }}>

        {/* A imagem da logo centralizada */}
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <img
            src={LOGO_SOBRE}
            alt="Logo vvAi — Símbolo que une cadeias montanhosas, rede neural e joia bruta"
            className="w-full h-auto max-w-[380px] drop-shadow-[0_0_40px_rgba(135,84,242,0.3)] select-none"
            draggable={false}
          />
        </div>

        {/* SVG Layer — Linhas + Pontos */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="dotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#AE42EF" />
              <stop offset="100%" stopColor="#8754F2" />
            </linearGradient>
            <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#AE42EF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#8754F2" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="lineGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#8754F2" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#4287f5" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#AE42EF" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#8754F2" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Linha: Montanhas (topo centro → label topo) */}
          <path
            d={`M ${annotations[0].dotX} ${annotations[0].dotY} 
                Q ${annotations[0].dotX - 0.5} ${annotations[0].dotY - 6}, 
                  ${annotations[0].labelX} ${annotations[0].labelY + 5}`}
            fill="none"
            stroke="url(#lineGradient1)"
            strokeWidth="0.4"
            strokeDasharray="2 1.5"
            className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '0.3s' }}
          />

          {/* Linha: Neural (esquerda baixo → label esquerda baixo) */}
          <path
            d={`M ${annotations[1].dotX} ${annotations[1].dotY} 
                Q ${annotations[1].dotX - 10} ${annotations[1].dotY + 5}, 
                  ${annotations[1].labelX + 12} ${annotations[1].labelY - 2}`}
            fill="none"
            stroke="url(#lineGradient2)"
            strokeWidth="0.4"
            strokeDasharray="2 1.5"
            className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '0.6s' }}
          />

          {/* Linha: Joia (direita baixo → label direita baixo) */}
          <path
            d={`M ${annotations[2].dotX} ${annotations[2].dotY} 
                Q ${annotations[2].dotX + 10} ${annotations[2].dotY + 5}, 
                  ${annotations[2].labelX - 12} ${annotations[2].labelY - 2}`}
            fill="none"
            stroke="url(#lineGradient3)"
            strokeWidth="0.4"
            strokeDasharray="2 1.5"
            className={`transition-all duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '0.9s' }}
          />

          {/* Pontos pulsantes */}
          {annotations.map((ann, i) => (
            <g
              key={ann.id}
              className={`transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
              style={{ transitionDelay: `${0.3 + i * 0.3}s` }}
            >
              <PulsingDot cx={ann.dotX} cy={ann.dotY} />
            </g>
          ))}
        </svg>

        {/* Labels HTML posicionados absolutamente */}
        {annotations.map((ann, i) => {
          // Estilos de posição por label
          const positionStyles: React.CSSProperties = {};

          if (ann.align === 'center') {
            // Topo centro
            positionStyles.top = '-45px';
            positionStyles.left = '50%';
            positionStyles.transform = 'translateX(-50%)';
            positionStyles.textAlign = 'center';
            positionStyles.maxWidth = '260px';
          } else if (ann.align === 'left') {
            // Embaixo esquerda
            positionStyles.bottom = '-40px';
            positionStyles.left = '-10px';
            positionStyles.textAlign = 'left';
            positionStyles.maxWidth = '220px';
          } else {
            // Embaixo direita
            positionStyles.bottom = '-40px';
            positionStyles.right = '-10px';
            positionStyles.textAlign = 'right';
            positionStyles.maxWidth = '220px';
          }

          return (
            <div
              key={ann.id}
              className={`absolute transition-all duration-700 ${
                isVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-3'
              }`}
              style={{
                ...positionStyles,
                transitionDelay: `${0.5 + i * 0.3}s`,
              }}
            >
              <div className="flex flex-col gap-0.5">
                <span className="font-azonix text-[10px] md:text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-vvai-purple to-vvai-highlight uppercase tracking-widest">
                  {ann.title}
                </span>
                <span className="text-[10px] md:text-[11px] text-vvai-text/50 leading-snug">
                  {ann.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Sub-componente para o conteúdo de texto e cards de Quem Somos
function AboutContent() {
  return (
    <div className="flex flex-col gap-6 max-w-xl z-10 px-4">
      {/* Título */}
      <h2 className="font-azonix text-3xl md:text-4xl font-extrabold text-vvai-blue-dark leading-tight">
        Quem <span className="text-vvai-highlight">Somos</span>
      </h2>

      {/* Descrição Principal */}
      <p className="text-lg text-vvai-text/80 leading-relaxed">
        A <strong className="text-vvai-purple">vvAi</strong> nasceu com a missão de democratizar o acesso à Inteligência Artificial. 
        Acreditamos que a tecnologia deve ser uma extensão da sua equipe, trabalhando incansavelmente 
        para transformar dados complexos em decisões claras e estratégicas.
      </p>

      {/* Cards de Missão e Visão (Mantendo a identidade visual do Hero) */}
      <div className="flex flex-col gap-4 mt-2">
        
        {/* Card Missão */}
        <div className="bg-white px-5 py-4 rounded-lg border border-vvai-text/5 border-l-4 border-l-vvai-purple shadow-sm w-full transition-transform hover:-translate-y-1 duration-300">
          <h3 className="font-bold text-sm text-vvai-purple tracking-wide uppercase mb-2">Nossa Missão</h3>
          <p className="text-sm text-vvai-text/70 leading-relaxed">
            Capacitar negócios de todos os tamanhos com soluções de IA acessíveis, seguras e práticas, automatizando processos e potencializando resultados.
          </p>
        </div>

        {/* Card Visão */}
        <div className="bg-white px-5 py-4 rounded-lg border border-vvai-text/5 border-l-4 border-l-vvai-highlight shadow-sm w-full transition-transform hover:-translate-y-1 duration-300">
          <h3 className="font-bold text-sm text-vvai-highlight tracking-wide uppercase mb-2">Nossa Visão</h3>
          <p className="text-sm text-vvai-text/70 leading-relaxed">
            Ser a ponte definitiva entre a inovação tecnológica e o sucesso prático do seu negócio, liderando a transformação digital com ética e eficiência.
          </p>
        </div>

      </div>
    </div>
  );
}

// O Container Principal da Seção
export default function About() {
  return (
    <section id="quem-somos" className="relative w-full min-h-screen py-20 flex items-center justify-center bg-vvai-bg overflow-hidden">
      
      {/* Container de Grid (Invertido em relação ao Hero: Imagem na esquerda, Texto na direita) */}
      <div className="container mx-auto px-4 md:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8 items-center">
        
        {/* COLUNA ESQUERDA: Logo Anotada */}
        <LogoAnnotated />

        {/* COLUNA DIREITA: Conteúdo de Texto */}
        <div className="flex justify-center md:justify-start items-center h-full">
          <AboutContent />
        </div>

      </div>

    </section>
  );
}
