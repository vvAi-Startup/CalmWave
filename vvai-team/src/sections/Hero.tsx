import { Canvas } from '@react-three/fiber'
import { Sparkles, Float, useTexture } from '@react-three/drei' // 'drei' é uma biblioteca de ajudantes incríveis
import { Suspense } from 'react'
import LOGO from '../assets/LOGO.png';
import SHIELD from '../assets/shield.png';
import LIGHTNING from '../assets/lightning.png';


// 1.5 O COMPONENTE DO HOLOGRAMA 2.5D
function VvAiHologram() {
  // O hook useTexture pega a imagem que você importou e transforma em "tinta 3D"
  const texture = useTexture(LOGO); 
  
  return (
    // O Float injeta a gravidade zero (sobe, desce e tomba de leve)
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
      <mesh>
        {/* O Plane é um "papel" 3D. args=[largura, altura]. */}
        <planeGeometry args={[5, 3]} /> 
        {/* Aplicamos a sua logo no papel, respeitando o fundo transparente */}
        <meshBasicMaterial map={texture} transparent={true} toneMapped={false} />
      </mesh>
    </Float>
  );
}


// 1. Separar o conteúdo em sub-componentes (React Profissional)
function HeroContent() {
  return (
    <div className="flex flex-col gap-4 md:gap-4 max-w-xl z-10 px-4">
      {/* Slogan Grande */}
      <h1 className="font-azonix text-4xl md:text-5xl font-extrabold text-vvai-blue-dark leading-tight">
        Inteligência Artificial que <span className="text-vvai-highlight">conecta</span> sua visão.
      </h1>

      {/* Slogan Pequeno/Descrição */}
      <p className="text-lg text-vvai-text/80 leading-relaxed max-w-lg">
        Na vvAi, transformamos dados em visões claras para o futuro do seu negócio, unindo lógica e criatividade.
      </p>

      {/* Div dos Cards Pequenos (Flexbox Pai) */}
      {/* Mudei items-center para items-stretch para que ambos os cards tenham a mesma altura, independente do texto */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mt-5">

      {/* Card 1 */}
        {/* 1. Ajustei o gap pai de gap-1 para gap-2 para dar um respiro melhor entre o cabeçalho e o texto */}
        <div className="flex flex-col items-start bg-white px-5 py-2 rounded-lg border border-vvai-text/5 border-l-4 border-l-vvai-purple shadow-sm w-full sm:max-w-[240px]">
          
          {/* 2. A NOVA SUB-CAIXA: Agrupa o Ícone Escudo e o Título lado a lado */}
          <div className="flex items-center">
            {/* 3. A imagem agora tem o tamanho exato e a classe de segurança object-contain */}
            <img src={SHIELD} alt="Shield" className="w-14 h-14 object-contain" />
            <h3 className="font-bold text-sm text-vvai-purple tracking-wide uppercase">Seguro</h3>
          </div>

          {/* 4. Descrição limpa, herdando o alinhamento da caixa pai */}
          <p className="text-xs text-vvai-text/70 leading-relaxed">
            Tecnologia avançada para proteger seus dados e garantir a confiabilidade da IA.
          </p>
          
        </div>

          {/* Card 2 */}
        {/* 1. O p-5 voltou para cá! O cartão inteiro agora tem espaçamento interno */}
        <div className="flex flex-col items-start bg-white px-5 py-2 rounded-lg border border-vvai-text/5 border-l-4 border-l-vvai-highlight shadow-sm w-full sm:max-w-[240px]">
          
          {/* 2. Adicionei items-center para o título ficar bem alinhado com esse seu ícone grandão */}
          <div className='flex items-center gap-3'>          
            <img src={LIGHTNING} alt="Lightning" className='w-14 h-14 object-contain' />
            {/* 3. Adeus mt-4! */}
            <h3 className="font-bold text-sm text-vvai-highlight tracking-wide uppercase">Prático</h3>
          </div>
          
          {/* 4. Adeus p-5! A distância para o título agora é controlada pelo 'gap-2' lá no pai */}
          <p className="text-xs text-vvai-text/70 leading-relaxed">
            A experiência fluida e intuitiva que você gostaria que todas as ferramentas tivessem.
          </p>
        </div>

      </div>
    </div>
  );
}

// 2. O Container Principal (O Layout Grid Split)
export default function Hero() {
  return (
    /* O Palco: H-screen ocupando a tela toda. Grid de 1 coluna (mobile) e 2 colunas (desktop). */
    <section className="relative w-full min-h-screen pt-[8%] grid grid-cols-1 md:grid-cols-2 items-center justify-center overflow-hidden bg-vvai-bg">

      {/* COLUNA ESQUERDA: O Conteúdo (Centralizado horizontalmente no Grid) */}
      <div className="flex justify-center md:justify-end items-center h-full px-4 md:px-12 md:mr-[-10vw]">
        <HeroContent />
      </div>

      {/* COLUNA DIREITA: O Elemento Visual (Logo 3D Híbrido) */}
      {/* 1. Removemos todas as animações CSS e perspectivas manuais. O Canvas cuida disso. */}
      <div className="relative flex justify-center items-center h-[50vh] md:h-full z-10 overflow-hidden">

        {/* O MOTOR 3D (React Three Fiber Canvas) */}
        {/* O Canvas preenche automaticamente 100% da altura e largura da div pai */}
        <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>

        {/* A. ILUMINAÇÃO */}
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#AE42EF" />

          {/* B. CONTROLES */}
          {/* Travamos o Pan e o Zoom para o usuário girar a logo, mas não tirá-la da tela */}
          {/* <OrbitControls enableZoom={false} enablePan={false} /> */}

          {/* C. O EFEITO NEON/DADOS (Sparkles) */}
          <Sparkles count={100} scale={5} size={2} speed={0.4} opacity={0.6} color="#AE42EF" />
          <Sparkles count={50} scale={4} size={3} speed={0.2} opacity={0.3} color="#4287f5" />

          {/* D. O HOLOGRAMA DA LOGO */}
          {/* O Suspense é obrigatório para o React esperar a imagem carregar antes de mostrar */}
          <Suspense fallback={null}>
            <VvAiHologram />
          </Suspense>
        </Canvas>

        {/* Removemos a camada invisível de interação, o Canvas já pega os cliques! */}
      </div>

    </section>
  );
}