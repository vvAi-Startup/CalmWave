'use client';

import Logo from './Logo';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { translations } from '@/locales/translations';

export default function Header() {
  const { language } = useAccessibility();
  const t = translations[language].header;

  return (
    <header 
      style={{ 
        backgroundColor: 'var(--header-bg)',
        borderBottomColor: 'var(--header-border)'
      }}
      className="backdrop-blur-md border-b sticky top-0 z-50 transition-all duration-300"
      role="banner"
    >
      <div className="container mx-auto px-6 py-4">
        <nav className="flex items-center justify-between" role="navigation" aria-label={language === 'pt' ? 'Navegação principal' : 'Main navigation'}>
          <Logo />
          <div className="hidden md:flex gap-8 items-center">
            <a
              href="#recursos"
              style={{ color: 'var(--text-secondary)' }}
              className="hover-primary-text transition-all duration-300 font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label={language === 'pt' ? 'Ir para seção de recursos' : 'Go to resources section'}
            >
              {t.resources}
            </a>
            <a
              href="#como-funciona"
              style={{ color: 'var(--text-secondary)' }}
              className="hover-primary-text transition-all duration-300 font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label={language === 'pt' ? 'Ir para seção como funciona' : 'Go to how it works section'}
            >
              {t.howItWorks}
            </a>
            <a
              href="#beneficios"
              style={{ color: 'var(--text-secondary)' }}
              className="hover-primary-text transition-all duration-300 font-medium hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-md px-2 py-1"
              aria-label={language === 'pt' ? 'Ir para seção de benefícios' : 'Go to benefits section'}
            >
              {t.benefits}
            </a>
            <button 
              className="bg-primary text-white px-6 py-2.5 rounded-full hover:bg-primary-hover transition-all duration-300 hover:shadow-lg hover:scale-105 font-medium focus:outline-none focus:ring-2 focus:ring-offset-2"
              aria-label={language === 'pt' ? 'Começar a usar CalmWave' : 'Get started with CalmWave'}
            >
              {t.start}
            </button>
          </div>
        </nav>
      </div>
    </header>
  );
}

