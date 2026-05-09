import CALMWAVE_LOGO from '../assets/calmwave/logo-calm-wave-branca.png';

// Sub-componente: Waveform animado em CSS puro
function Waveform() {
  const bars = Array.from({ length: 28 }, (_, i) => i);
  return (
    <div className="flex items-center justify-center gap-[3px] h-16">
      {bars.map((i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-vvai-highlight to-vvai-purple"
          style={{
            height: `${20 + Math.sin(i * 0.8) * 50 + Math.random() * 30}%`,
            animation: `wave ${0.8 + (i % 5) * 0.15}s ease-in-out infinite alternate`,
            animationDelay: `${(i * 0.06).toFixed(2)}s`,
            opacity: 0.6 + (i % 3) * 0.15,
          }}
        />
      ))}
    </div>
  );
}

// Sub-componente: Métrica de impacto
function StatBadge({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-azonix text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-vvai-highlight to-vvai-purple">
        {value}
      </span>
      <span className="text-xs text-white/40 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export default function Projects() {
  return (
    <section id="projetos" className="relative w-full py-32 bg-vvai-text overflow-hidden">

      {/* ── Glows de ambiente ── */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-vvai-highlight/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-vvai-purple/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[300px] bg-vvai-blue/5 rounded-full blur-[100px] pointer-events-none" />

      {/* ── Textura de ruído sutil ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 md:px-12 relative z-10">

        {/* ── Cabeçalho ── */}
        <div className="mb-20 flex flex-col gap-5">
          {/* Badge pulsante */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-vvai-highlight opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-vvai-highlight" />
            </span>
            <span className="text-vvai-highlight font-bold tracking-widest uppercase text-xs">
              Nosso Ecossistema
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <h2 className="font-azonix text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight max-w-lg">
              Projetos em{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-vvai-purple via-vvai-highlight to-vvai-blue">
                Destaque
              </span>
            </h2>
            <p className="text-white/40 max-w-xs text-sm leading-relaxed md:text-right">
              Soluções que combinam inteligência artificial de ponta com design centrado no humano.
            </p>
          </div>

          {/* Divider com gradiente */}
          <div className="h-px w-full bg-gradient-to-r from-vvai-purple/60 via-vvai-highlight/40 to-transparent mt-2" />
        </div>

        {/* ── MEGA CARD — Calmwave ── */}
        <div className="group relative rounded-3xl p-[1px] bg-gradient-to-br from-vvai-purple/50 via-vvai-highlight/30 to-vvai-blue/20 shadow-[0_0_80px_rgba(174,66,239,0.12)] hover:shadow-[0_0_120px_rgba(174,66,239,0.22)] transition-all duration-700">

          {/* Inner card */}
          <div className="relative rounded-[23px] overflow-hidden bg-[#07070d] flex flex-col lg:flex-row min-h-[520px]">

            {/* ── COLUNA ESQUERDA: Copy ── */}
            <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-between gap-8 relative z-10">

              {/* Glow interno esquerdo */}
              <div className="absolute top-0 left-0 w-72 h-72 bg-vvai-purple/10 rounded-full blur-[80px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

              {/* Header do projeto */}
              <div className="flex flex-col gap-6">
                {/* Logo + Nome */}
                <div className="flex items-center gap-4">
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-tr from-vvai-purple to-vvai-highlight p-[1px] flex-shrink-0 shadow-[0_0_24px_rgba(174,66,239,0.5)]">
                    <div className="w-full h-full rounded-[14px] bg-[#0e0e1a] flex items-center justify-center">
                      <img
                        src={CALMWAVE_LOGO}
                        alt="Calmwave Logo"
                        className="w-9 h-9 object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-extrabold text-white tracking-wide leading-none">
                      Calmwave
                    </h3>
                    <span className="text-xs text-vvai-highlight/70 font-medium tracking-widest uppercase">
                      Acessibilidade por IA
                    </span>
                  </div>
                </div>

                {/* Descrição */}
                <p className="text-white/60 text-base leading-relaxed max-w-lg">
                  Uma solução revolucionária impulsionada por IA para pessoas com{' '}
                  <span className="text-white/90 font-medium">
                    Transtorno do Processamento Auditivo Central (TPAC)
                  </span>
                  . Utilizamos redes neurais de última geração para isolar e amplificar fala em tempo real, transformando a qualidade de vida de quem mais precisa.
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {['Deep Learning', 'Acessibilidade', 'Áudio em Tempo Real', 'Flutter'].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-white/5 text-white/50 border border-white/8 hover:border-vvai-purple/40 hover:text-white/80 transition-colors duration-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Métricas */}
              <div className="flex items-center gap-8 py-5 border-t border-white/6">
                <StatBadge value="98%" label="Precisão" />
                <div className="h-8 w-px bg-white/8" />
                <StatBadge value="&lt;50ms" label="Latência" />
                <div className="h-8 w-px bg-white/8" />
                <StatBadge value="TPAC" label="Foco" />
              </div>

              {/* CTA */}
              <div className="flex items-center gap-4">
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-vvai-purple to-vvai-highlight text-white font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(174,66,239,0.3)] hover:shadow-[0_0_35px_rgba(174,66,239,0.5)] hover:scale-105 transition-all duration-300"
                >
                  Conheça a Tecnologia
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/10 text-white/60 font-semibold text-sm tracking-wide hover:border-vvai-purple/50 hover:text-white transition-all duration-300"
                >
                  Ver Demo
                </a>
              </div>
            </div>

            {/* ── COLUNA DIREITA: Visual ── */}
            <div className="flex-1 relative min-h-[380px] lg:min-h-full overflow-hidden border-t lg:border-t-0 lg:border-l border-white/5">

              {/* Glow interno direito */}
              <div className="absolute inset-0 bg-gradient-to-br from-vvai-purple/15 via-transparent to-vvai-highlight/8 pointer-events-none" />

              {/* Grid de pontos decorativo */}
              <div
                className="absolute inset-0 opacity-[0.07]"
                style={{
                  backgroundImage: 'radial-gradient(circle, #8754F2 1px, transparent 1px)',
                  backgroundSize: '28px 28px',
                }}
              />

              {/* Container central da arte */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-8">

                {/* Logo grande com brilho */}
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-vvai-purple/20 blur-3xl scale-150 group-hover:bg-vvai-purple/30 transition-all duration-1000" />
                  <img
                    src={CALMWAVE_LOGO}
                    alt="Calmwave"
                    className="relative w-36 h-36 md:w-44 md:h-44 object-contain opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 drop-shadow-[0_0_30px_rgba(174,66,239,0.6)]"
                  />
                </div>

                {/* Waveform animado */}
                <div className="w-full max-w-xs">
                  <Waveform />
                </div>

                {/* Rótulo "Live Processing" */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/8 backdrop-blur-sm">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                  </span>
                  <span className="text-xs text-white/50 font-medium tracking-widest uppercase">
                    Live Audio Processing
                  </span>
                </div>
              </div>

              {/* Gradiente de fade na borda esquerda (apenas desktop) */}
              <div className="absolute top-0 left-0 h-full w-16 bg-gradient-to-r from-[#07070d] to-transparent hidden lg:block pointer-events-none" />
            </div>

          </div>
        </div>

        {/* ── Rodapé da seção: "Mais em breve" ── */}
        <div className="mt-12 flex items-center gap-4">
          <div className="flex-1 h-px bg-white/6" />
          <span className="text-white/25 text-xs font-medium tracking-widest uppercase px-4">
            Mais projetos em breve
          </span>
          <div className="flex-1 h-px bg-white/6" />
        </div>

      </div>

      {/* Keyframe da animação da waveform */}
      <style>{`
        @keyframes wave {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1); }
        }
      `}</style>
    </section>
  );
}