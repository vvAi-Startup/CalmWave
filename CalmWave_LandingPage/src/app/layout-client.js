'use client';

import { AccessibilityProvider, useAccessibility, colorBlindFilters } from '@/contexts/AccessibilityContext';
import ColorBlindFilters from '@/components/ColorBlindFilters';
import AccessibilityMenu from '@/components/AccessibilityMenu';

function LayoutContent({ children }) {
  const { colorBlindMode, language } = useAccessibility();
  const skipText = language === 'pt' ? 'Pular para o conteúdo principal' : 'Skip to main content';

  return (
    <>
      <ColorBlindFilters />
      <a href="#main-content" className="skip-to-content">
        {skipText}
      </a>
      <div 
        id="main-content"
        style={{ filter: colorBlindFilters[colorBlindMode]?.filter || 'none' }}
      >
        {children}
      </div>
      <AccessibilityMenu />
    </>
  );
}

export default function LayoutClient({ children }) {
  return (
    <AccessibilityProvider>
      <LayoutContent>{children}</LayoutContent>
    </AccessibilityProvider>
  );
}
