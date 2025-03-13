import React from 'react';
import Link from 'next/link';
import { BsMusicNote, BsHeadphones } from 'react-icons/bs';
import { FaGithub, FaLinkedin, FaInstagram, FaTwitter } from 'react-icons/fa';
import { MdEmail, MdLocationOn } from 'react-icons/md';

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-blue-900 via-purple-800 to-purple-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Logo e Descrição */}
          <div className="flex flex-col items-center md:items-start">
            <Link 
              href="/home"
              className="flex items-center space-x-3 group mb-4 hover:scale-105 transition-all duration-300"
              aria-label="Ir para página inicial"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:shadow-xl">
                <BsMusicNote className="text-3xl text-purple-600" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Calm Wave
              </span>
            </Link>
            <p className="text-white text-center md:text-left max-w-sm leading-relaxed">
              Revolucionando a experiência sonora através de tecnologia inovadora e inteligência artificial para criar ambientes mais harmoniosos.
            </p>
            <div className="mt-6 flex items-center space-x-2 text-white">
              <BsHeadphones className="text-xl" />
              <span>Sua paz sonora é nossa prioridade</span>
            </div>
          </div>

          {/* Links Rápidos */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-center md:text-left text-white">
              Links Rápidos
            </h3>
            <ul className="space-y-3 text-center md:text-left">
              <li>
                <Link href="/home" className="text-white hover:text-blue-300 transition-all duration-300 hover:translate-x-2 inline-flex">
                  → Início
                </Link>
              </li>
              <li>
                <Link href="/Audios/lista" className="text-white hover:text-blue-300 transition-all duration-300 hover:translate-x-2 inline-flex">
                  → Áudios Analisados
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="text-white hover:text-blue-300 transition-all duration-300 hover:translate-x-2 inline-flex">
                  → Dashboard
                </Link>
              </li>
              <li>
                <Link href="/Suporte" className="text-white hover:text-blue-300 transition-all duration-300 hover:translate-x-2 inline-flex">
                  → Suporte
                </Link>
              </li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-center md:text-left text-white">
              Contato
            </h3>
            <div className="space-y-4">
              <p className="flex items-center space-x-3 text-white">
                <MdEmail className="text-xl text-blue-300" />
                <a href="mailto:contato@calmwave.com" className="hover:text-blue-300 transition-colors duration-300">
                  contato@calmwave.com
                </a>
              </p>
              <p className="flex items-center space-x-3 text-white">
                <MdLocationOn className="text-xl text-blue-300" />
                <span>Registro, SP - Brasil</span>
              </p>
            </div>
          </div>

          {/* Redes Sociais */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-center md:text-left text-white">
              Redes Sociais
            </h3>
            <div className="flex space-x-4 justify-center md:justify-start">
              <a 
                href="https://github.com/seu-usuario" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110"
                aria-label="GitHub"
              >
                <FaGithub size={24} className="text-white" />
              </a>
              <a 
                href="https://linkedin.com/in/seu-perfil" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <FaLinkedin size={24} className="text-white" />
              </a>
              <a 
                href="https://instagram.com/seu-perfil" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <FaInstagram size={24} className="text-white" />
              </a>
              <a 
                href="https://twitter.com/seu-perfil" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-white/20 p-3 rounded-full hover:bg-white/30 transition-all duration-300 hover:scale-110"
                aria-label="Twitter"
              >
                <FaTwitter size={24} className="text-white" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-white/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-white text-center md:text-left">
              © {new Date().getFullYear()} Calm Wave. Todos os direitos reservados.
            </p>
            <div className="mt-4 md:mt-0">
              <Link href="/privacidade" className="text-white hover:text-blue-300 mx-3 transition-colors duration-300">
                Política de Privacidade
              </Link>
              <Link href="/termos" className="text-white hover:text-blue-300 mx-3 transition-colors duration-300">
                Termos de Uso
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
