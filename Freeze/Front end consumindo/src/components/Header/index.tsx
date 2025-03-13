import React, { useState } from 'react';
import Link from 'next/link';
import { AiOutlineHome, AiOutlineAudio } from 'react-icons/ai';
import { BiBarChartAlt2 } from 'react-icons/bi';
import { BsMusicNote, BsList, BsX } from 'react-icons/bs';
import { MdOutlineAnalytics } from 'react-icons/md';
import { FiLogOut } from 'react-icons/fi';
import { IoMdHelpCircleOutline } from 'react-icons/io';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Função para lidar com navegação por teclado no menu
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape' && isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  return (
    <header 
      className="bg-gradient-to-r from-blue-900 via-purple-800 to-purple-900 p-4 shadow-xl sticky top-0 z-50 backdrop-blur-sm bg-opacity-90" 
      role="banner"
      onKeyDown={handleKeyPress}
    >
      <div className="container mx-auto flex justify-between items-center">
        <Link 
          href="/home" 
          className="flex items-center space-x-3 group focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg" 
          aria-label="Ir para página inicial"
        >
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
            <BsMusicNote className="text-2xl" aria-label="Ícone musical" />
          </div>
          <h1 className="text-white text-3xl font-extrabold tracking-wider hover:text-purple-300 transition-colors duration-300">
            Calm Wave
          </h1>
        </Link>

        {/* Menu para Desktop */}
        <nav 
          className="hidden md:block" 
          role="navigation" 
          aria-label="Menu principal"
        >
          <ul className="flex space-x-8 text-lg font-medium">
            
            <li>
              <Link 
                href="/Audios/lista" 
                className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg p-2" 
                aria-label="Ver áudios analisados"
              >
                <BiBarChartAlt2 className="text-xl" aria-hidden="true" />
                <span>Áudios Analisados</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard" 
                className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg p-2" 
                aria-label="Ir para o dashboard"
              >
                <MdOutlineAnalytics className="text-xl" aria-hidden="true" />
                <span>Dados</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/Suporte" 
                className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-lg p-2" 
                aria-label="Ir para suporte"
              >
                <IoMdHelpCircleOutline className="text-xl" aria-hidden="true" />
                <span>Suporte</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/Logout" 
                className="text-white hover:text-gray-300 transition duration-300 flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-white rounded-lg p-2 font-bold hover:bg-white/10" 
                aria-label="Encerrar sessão e fazer logout do sistema"
              >
                <FiLogOut className="text-xl" aria-hidden="true" />
                <span>Sair</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Botão Menu Mobile */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-white hover:text-purple-300 transition-colors duration-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
          aria-controls="mobile-menu"
        >
          {isMenuOpen ? (
            <BsX className="w-8 h-8" aria-hidden="true" />
          ) : (
            <BsList className="w-8 h-8" aria-hidden="true" />
          )}
        </button>

        {/* Menu Mobile */}
        {isMenuOpen && (
          <nav 
            id="mobile-menu"
            className="absolute top-full left-0 right-0 bg-gradient-to-r from-blue-900 via-purple-800 to-purple-900 p-4 md:hidden shadow-lg"
            role="navigation" 
            aria-label="Menu mobile"
          >
            <ul className="space-y-4 text-lg font-medium">
              <li>
                <Link 
                  href="/home" 
                  className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                  aria-label="Ir para página inicial"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <AiOutlineHome className="text-xl" aria-hidden="true" />
                  <span>Início</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/Audios/Analisar-audio" 
                  className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                  aria-label="Ir para análise de áudio"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <AiOutlineAudio className="text-xl" aria-hidden="true" />
                  <span>Analisar Áudio</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/Audios/lista" 
                  className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                  aria-label="Ver áudios analisados"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <BiBarChartAlt2 className="text-xl" aria-hidden="true" />
                  <span>Áudios Analisados</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/dashboard" 
                  className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                  aria-label="Ir para o dashboard"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MdOutlineAnalytics className="text-xl" aria-hidden="true" />
                  <span>Dados</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/Suporte" 
                  className="text-white hover:text-purple-300 transition duration-300 flex items-center space-x-2 p-2 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                  aria-label="Ir para suporte"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <IoMdHelpCircleOutline className="text-xl" aria-hidden="true" />
                  <span>Suporte</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/Logout" 
                  className="text-red-400 hover:text-red-300 transition duration-300 flex items-center space-x-2 p-2 rounded-lg hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-red-400 w-full font-bold border border-white"
                  aria-label="Encerrar sessão e fazer logout do sistema"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <FiLogOut className="text-xl" aria-hidden="true" />
                  <span>Sair</span>
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
