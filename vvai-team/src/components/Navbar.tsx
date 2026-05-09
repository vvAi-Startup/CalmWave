import { useState, useEffect } from "react";
import logoNav from '../assets/logoNav.svg';
import iconeNavFaleConosco from '../assets/iconeNavFaleConosco.png';

export default function Navbar() {

  const [active, setActive] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = ['quem-somos', 'nossa-equipe', 'projetos'];
      let currentSection = '';

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Se a seção estiver visível na metade superior da tela
          if (rect.top <= 300 && rect.bottom >= 300) {
            currentSection = section;
            break;
          }
        }
      }

      // Limpa a seleção se estiver no topo absoluto (Hero)
      if (window.scrollY < 200) {
        currentSection = '';
      }

      setActive(currentSection);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Checagem inicial

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    /* Container Pai: Invisível, fixa no topo e centraliza */
    <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">

      {/* A Barra em si: Glassmorphism + Borda Neon animada */}
      <nav className="neon-nav w-full max-w-5xl flex items-center justify-between px-6 py-3 rounded-full backdrop-blur-xl shadow-lg">
        
        {/* LADO ESQUERDO: Logo da vvAi */}
        <div className="flex items-center gap-2 cursor-pointer">
          <img src={logoNav} alt="Logo vvAi" className="w-auto h-8" />
        </div>

        {/* LADO DIREITO: Os Links */}
        <div className="hidden md:flex items-center gap-2 text-sm font-medium text-vvai-text">

          <a href="#quem-somos" 
            onClick={() => setActive('quem-somos')}
            className={`px-4 py-2 rounded-full transition-all duration-300
              ${active === 'quem-somos' 
                ? 'text-vvai-text bg-vvai-bg shadow-md'
                : 'text-vvai-text/70 hover:text-vvai-text hover:bg-vvai-text/10'
              }`}
          >
            Quem Somos
          </a>

          <a href="#nossa-equipe" 
            onClick={() => setActive('nossa-equipe')}
            className={`px-4 py-2 rounded-2xl transition-all duration-300
              ${active === 'nossa-equipe' 
                ? 'text-vvai-text bg-vvai-bg shadow-md'
                : 'text-vvai-text/70 hover:text-vvai-text hover:bg-vvai-text/10'
              }`}
          >
            Nossa Equipe
          </a>

          <a 
            href="#projetos" 
            onClick={() => setActive('projetos')}
            className={`px-4 py-2 rounded-full transition-all duration-300
              ${active === 'projetos' 
                ? 'bg-vvai-bg text-vvai-text shadow-md' 
                : 'text-vvai-text/70 hover:text-vvai-text hover:bg-vvai-text/10' 
              }`}
          >
            Projetos
          </a>
          
          {/* O Botão Fale Conosco (CTA Fixo) */}
          <a 
            href="#contato" 
            className="ml-4 px-5 py-2 rounded-full bg-vvai-purple-dark text-vvai-bg font-bold hover:bg-vvai-highlight hover:text-white transition-colors duration-300 shadow-md flex items-center gap-2"
          >
            Fale Conosco
            <img src={iconeNavFaleConosco} alt="Ícone Fale Conosco" className="w-4 h-4" />
          </a>

        </div>

      </nav>
    </div>
  )
}