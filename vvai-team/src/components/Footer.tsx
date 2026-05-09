import logoNav from '../assets/logoNav.svg';

export default function Footer() {
  return (
    <footer id="contato" className="bg-vvai-text text-vvai-bg py-12 px-6 relative overflow-hidden">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        
        {/* Brand & Logo */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-3">
            <img src={logoNav} alt="Logo vvAi" className="h-10 w-auto brightness-0 invert" />
          </div>
          <p className="text-vvai-bg/70 text-sm max-w-xs text-center md:text-left">
            Moldando o futuro da tecnologia com soluções inovadoras e design inteligente.
          </p>
        </div>

        {/* Contact Info */}
        <div className="flex flex-col items-center md:items-end gap-4">
          <h3 className="font-azonix text-lg text-vvai-highlight mb-2">Contato</h3>
          
          <div className="flex flex-col gap-3">
            {/* Phone */}
            <a href="tel:+5513996318473" className="flex items-center gap-3 hover:text-vvai-highlight transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-vvai-bg/10 flex items-center justify-center border border-vvai-bg/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <span className="font-medium">(13) 99631-8473</span>
            </a>

            {/* Email */}
            <a href="mailto:vvai2023ltda@gmail.com" className="flex items-center gap-3 hover:text-vvai-highlight transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-vvai-bg/10 flex items-center justify-center border border-vvai-bg/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
              </div>
              <span className="font-medium">vvai2023ltda@gmail.com</span>
            </a>

            {/* Instagram */}
            <a href="https://www.instagram.com/calmwave.vvai?igsh=ZnMzdGV3N3BybWxs" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-vvai-highlight transition-colors duration-300">
              <div className="w-10 h-10 rounded-full bg-vvai-bg/10 flex items-center justify-center border border-vvai-bg/20">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line>
                </svg>
              </div>
              <span className="font-medium">@calmwave.vvai</span>
            </a>
          </div>
        </div>
      </div>
      
      {/* Footer Bottom */}
      <div className="max-w-5xl mx-auto mt-12 pt-6 border-t border-vvai-bg/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-vvai-bg/50 relative z-10">
        <p>&copy; {new Date().getFullYear()} vvAi. Todos os direitos reservados.</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-vvai-bg transition-colors">Termos de Uso</a>
          <a href="#" className="hover:text-vvai-bg transition-colors">Política de Privacidade</a>
        </div>
      </div>

      {/* Decorative Glow Elements */}
      <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-vvai-purple/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute -top-32 -right-32 w-64 h-64 bg-vvai-highlight/20 rounded-full blur-[100px] pointer-events-none"></div>
    </footer>
  );
}
