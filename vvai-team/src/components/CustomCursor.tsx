import { useEffect, useState } from 'react';

export default function CustomCursor() {
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    // Só ativa o cursor customizado em telas não-touch/desktop
    const checkIsDesktop = () => {
      setIsDesktop(window.matchMedia('(pointer: fine)').matches);
    };
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);

    const updatePosition = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const updateHoverState = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Checa se o mouse está sobre um elemento clicável
      if (target.closest('a, button, [role="button"], input, textarea, select')) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    if (isDesktop) {
      window.addEventListener('mousemove', updatePosition);
      window.addEventListener('mouseover', updateHoverState);
    }

    return () => {
      window.removeEventListener('resize', checkIsDesktop);
      window.removeEventListener('mousemove', updatePosition);
      window.removeEventListener('mouseover', updateHoverState);
    };
  }, [isDesktop]);

  if (!isDesktop) return null;

  return (
    <>
      {/* O ponto central */}
      <div 
        className="fixed top-0 left-0 w-2 h-2 bg-vvai-highlight rounded-full pointer-events-none z-[9999] transition-transform duration-75 ease-out"
        style={{ transform: `translate(${position.x - 4}px, ${position.y - 4}px) scale(${isHovering ? 0 : 1})` }}
      />
      {/* O círculo vazado */}
      <div 
        className={`fixed top-0 left-0 w-8 h-8 border-2 border-vvai-highlight rounded-full pointer-events-none z-[9998] transition-all duration-300 ease-out flex items-center justify-center ${isHovering ? 'bg-vvai-highlight/20 border-vvai-highlight/50' : ''}`}
        style={{ transform: `translate(${position.x - 16}px, ${position.y - 16}px) scale(${isHovering ? 1.5 : 1})` }}
      />
    </>
  );
}
