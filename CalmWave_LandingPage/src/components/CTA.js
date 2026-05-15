'use client';

// Importando novos ícones para as novas ações
import { HiOutlineArrowRight, HiOutlineUsers, HiOutlineSparkles, HiOutlineChatBubbleLeftRight, HiOutlinePlay } from 'react-icons/hi2';
import { motion } from 'framer-motion';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { translations } from '@/locales/translations';
import { FaInstagram } from 'react-icons/fa6'; // Ícone específico para Instagram

export default function CTA() {
  const { language } = useAccessibility();
  const t = translations[language].cta;

  // Função utilitária para um estilo de botão
  const buttonBaseClasses = "px-8 py-4 rounded-full font-semibold inline-flex items-center justify-center gap-2 transition-all duration-300";

  return (
    <section className="py-20 bg-[#FEFDFA]" role="region" aria-label={language === 'pt' ? 'Chamada para ação' : 'Call to action'}>
      <div className="container mx-auto px-6">
        <motion.div 
          className="bg-teal-500 rounded-3xl p-12 md:p-16 text-center text-white shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          {/* Elementos de fundo animados mantidos */}
          <motion.div
            className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl"
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl"
            animate={{
              x: [0, -100, 0],
              y: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          <motion.h2 
            className="text-4xl md:text-5xl font-bold mb-6 relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {t.title}
          </motion.h2>
          <motion.p 
            className="text-xl mb-12 text-teal-50 max-w-2xl mx-auto relative z-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            {t.subtitle}
          </motion.p>

          {/* Botões Principais (Empilhamento horizontal em telas maiores) */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* 1. Botão Principal: Experimente Gratuitamente */}
            <motion.a 
              href="https://github.com/vvAi-Startup/Application_mobile" // Adicionando um href de exemplo
              target="_blank"
              className={`${buttonBaseClasses} bg-white text-teal-600 shadow-lg hover:shadow-xl`}
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 20px rgba(0, 0, 0, 0.2)"
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              aria-label={language === 'pt' ? 'Experimente Calm Wave gratuitamente' : 'Try Calm Wave for free'}
            >
              <HiOutlinePlay className="w-5 h-5" aria-hidden="true" /> {/* Ícone de 'Play/Começar' */}
              {t.mainAction}
            </motion.a>

            {/* 2. Botão Secundário: Fale Conosco */}
            <motion.a 
              href="https://www.instagram.com/calmwave.vvai" // Adicionando um href de exemplo
              target="_blank"
              className={`${buttonBaseClasses} border-2 border-white text-white hover:bg-white/10`}
              whileHover={{ 
                scale: 1.05,
              }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              aria-label={language === 'pt' ? 'Fale Conosco sobre o Calm Wave' : 'Contact us about Calm Wave'}
            >
              <HiOutlineChatBubbleLeftRight className="w-5 h-5" aria-hidden="true" />
              {t.secondaryAction}
            </motion.a>
          </motion.div>
          
          {/* Links Adicionais (Menos proeminentes) */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center relative z-10 text-sm font-medium"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <motion.a
              href="https://vvai-plataform.vercel.app/" // Adicionando um href de exemplo
              className="text-white/80 hover:text-white inline-flex items-center gap-2 transition-colors duration-300"
              aria-label={t.teamLink}
              target="_blank"
            >
              <HiOutlineUsers className="w-4 h-4" aria-hidden="true" />
              {t.teamLink}
              <HiOutlineArrowRight className="w-4 h-4 ml-1" />
            </motion.a>

            <span className="hidden sm:inline-block text-white/50">|</span>

            <motion.a
              href="https://www.instagram.com/calmwave.vvai" // Adicionando um href de exemplo
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/80 hover:text-white inline-flex items-center gap-2 transition-colors duration-300"
              aria-label={t.socialLink}
            >
              <FaInstagram className="w-4 h-4" aria-hidden="true" />
              {t.socialLink}
              <HiOutlineArrowRight className="w-4 h-4 ml-1" />
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}