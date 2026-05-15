'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AccessibilityContext = createContext();

export const colorBlindFilters = {
  none: {
    name: 'Normal',
    filter: 'none'
  },
  protanopia: {
    name: 'Protanopia',
    filter: 'url(#protanopia-filter)'
  },
  deuteranopia: {
    name: 'Deuteranopia',
    filter: 'url(#deuteranopia-filter)'
  },
  tritanopia: {
    name: 'Tritanopia',
    filter: 'url(#tritanopia-filter)'
  },
  achromatopsia: {
    name: 'Acromatopsia',
    filter: 'grayscale(100%)'
  }
};

export function AccessibilityProvider({ children }) {
  const [colorBlindMode, setColorBlindMode] = useState('none');
  const [language, setLanguage] = useState('pt');

  useEffect(() => {
    const savedMode = localStorage.getItem('colorBlindMode');
    const savedLang = localStorage.getItem('language');
    if (savedMode) setColorBlindMode(savedMode);
    if (savedLang) setLanguage(savedLang);
  }, []);

  const changeColorBlindMode = (mode) => {
    setColorBlindMode(mode);
    localStorage.setItem('colorBlindMode', mode);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        colorBlindMode,
        changeColorBlindMode,
        language,
        changeLanguage
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within AccessibilityProvider');
  }
  return context;
}
