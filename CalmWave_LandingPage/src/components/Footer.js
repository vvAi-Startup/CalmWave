'use client';

import { HiOutlineEnvelope, HiOutlinePhone, HiOutlineMapPin } from 'react-icons/hi2';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { translations } from '@/locales/translations';
import Logo from './Logo';

export default function Footer() {
  const { language } = useAccessibility();
  // 't' agora acessa o objeto do footer na tradução atual
  const t = translations[language].footer;
  // 'tLinks' agora acessa o objeto de links específico
  const tLinks = t.links;

  // 1. Atualizando o objeto de links para refletir a estrutura de tradução
  const footerLinks = {
    // Coluna 1: Saiba Mais (Restrito a 'O Produto')
    [t.saibaMais]: [
      { name: tLinks.product, href: "#" }, // Link para a seção do produto
      // removidos: resources, pricing, faq
    ],
    // Coluna 2: Empresa (Restrito a 'Sobre Nós' e 'Nossa Equipe')
    [t.empresa]: [
      // { name: tLinks.about, href: "#sobre" },
      { name: tLinks.team, href: "https://vvai-plataform.vercel.app/" }, // O novo link da equipe
      // removidos: blog, careers
    ],
    // Coluna 3: Ajuda e Suporte (Restrito a contato sem telefone)
    [t.ajuda]: [
      // { name: tLinks.contact, href: "/contato" }, // Link para a página de contato dedicada
      { icon: HiOutlineEnvelope, text: "vvai2023ltda@gmail.com", href: "mailto:vvai2023ltda@gmail.com" },
      // removido: HiOutlinePhone (telefone)
      { icon: HiOutlineMapPin, text: "Registro, SP", href: "http://maps.google.com/?q=Registro,SP" } // Corrigindo o href do mapa
    ]
  };

  // Funções auxiliares para mapear os links e contatos
  const renderLinks = (links) => {
    // Filtra links que NÃO possuem ícone (links de navegação)
    return links.filter(link => !link.icon).map((link, index) => (
      <li key={index}>
        <a 
          href={link.href} 
          className="hover:text-teal-500 transition-all duration-300 hover:translate-x-1 inline-block focus:outline-none focus:text-teal-500"
          aria-label={`${language === 'pt' ? 'Link para' : 'Link to'} ${link.name}`}
        >
          {link.name}
        </a>
      </li>
    ));
  };

  const renderContacts = (contacts) => {
    // Filtra links que possuem ícone (links de contato)
    return contacts.filter(item => item.icon).map((item, index) => (
      <li key={`contact-${index}`} className="flex items-center gap-2">
        <item.icon className="w-5 h-5 text-teal-500 flex-shrink-0" aria-hidden="true" />
        <a 
          href={item.href} 
          className="hover:text-teal-500 transition-colors duration-300 focus:outline-none focus:text-teal-500"
          aria-label={item.text}
        >
          {item.text}
        </a>
      </li>
    ));
  };

  // Reorganizando a ordem das colunas no grid
  const columnOrder = [t.saibaMais, t.empresa, t.ajuda];

  return (
    <footer className="bg-white border-t border-slate-200 py-12" role="contentinfo">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8 mb-8"> {/* Alterei para grid-cols-4 para acomodar as 3 colunas + a descrição */}
          {/* Logo e Descrição */}
          <div className="animate-fadeIn md:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="w-10 h-10 text-teal-500" aria-label="Logo CalmWave">
                <Logo variant="colored" showText={false} />
              </div>
              <span className="text-xl font-bold text-slate-900">Calm Wave</span>
            </div>
            <p className="text-slate-600">
              {t.description}
            </p>
          </div>

          {/* Seções de Links (Iterando sobre as chaves) */}
          {columnOrder.map((columnKey, colIndex) => {
            // A última coluna (Ajuda e Suporte) combina links e contatos.
            const isContactColumn = columnKey === t.ajuda;
            const links = footerLinks[columnKey];

            // Renderiza as colunas de links (Saiba Mais e Empresa)
            if (!isContactColumn) {
              return (
                <div key={columnKey} className="animate-fadeIn" style={{ animationDelay: `${0.1 + colIndex * 0.1}s` }}>
                  <h4 className="font-bold mb-4 text-teal-500">{columnKey}</h4>
                  <ul className="space-y-2 text-slate-600">
                    {renderLinks(links)}
                  </ul>
                </div>
              );
            }

            // Renderiza a coluna de Ajuda e Suporte (Links + Contatos)
            return (
              <div key={columnKey} className="animate-fadeIn" style={{ animationDelay: `${0.3}s` }}>
                <h4 className="font-bold mb-4 text-teal-500">{columnKey}</h4>
                <ul className="space-y-2 text-slate-600">
                  {renderLinks(links)} {/* Links de navegação (Fale Conosco) */}
                </ul>
                <ul className="space-y-3 text-slate-600 mt-4 border-t border-slate-100 pt-4">
                  {renderContacts(links)} {/* Contatos com ícones */}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Copyright */}
        <div className="border-t border-slate-200 pt-8 text-center text-slate-600">
          <p>{t.copyright}</p>
        </div>
      </div>
    </footer>
  );
}