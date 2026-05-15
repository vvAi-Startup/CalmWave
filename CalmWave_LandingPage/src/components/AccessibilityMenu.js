'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineAdjustmentsHorizontal, HiOutlineLanguage, HiOutlineEye } from 'react-icons/hi2';
import { useAccessibility, colorBlindFilters } from '@/contexts/AccessibilityContext';
import { translations } from '@/locales/translations';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { colorBlindMode, changeColorBlindMode, language, changeLanguage } = useAccessibility();
  const t = translations[language].accessibility;

  const filterNames = {
    none: t.normal,
    protanopia: t.protanopia,
    deuteranopia: t.deuteranopia,
    tritanopia: t.tritanopia,
    achromatopsia: t.achromatopsia
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 bg-teal-500 text-white p-4 rounded-full shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={language === 'pt' ? 'Menu de acessibilidade' : 'Accessibility menu'}
        aria-expanded={isOpen}
      >
        <HiOutlineAdjustmentsHorizontal className="w-6 h-6" />
      </motion.button>

      {/* Menu Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Content */}
            <motion.div
              className="fixed bottom-24 right-6 z-50 bg-white rounded-2xl shadow-2xl p-6 w-80"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <HiOutlineAdjustmentsHorizontal className="w-5 h-5 text-teal-500" />
                {language === 'pt' ? 'Acessibilidade' : 'Accessibility'}
              </h3>

              {/* Language Selection */}
              <div className="mb-6">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <HiOutlineLanguage className="w-4 h-4 text-teal-500" />
                  {t.language} / Language
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <motion.button
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      language === 'pt'
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => changeLanguage('pt')}
                  >
                    🇧🇷 Português
                  </motion.button>
                  <motion.button
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      language === 'en'
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => changeLanguage('en')}
                  >
                    🇺🇸 English
                  </motion.button>
                </div>
              </div>

              {/* Color Blind Mode */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <HiOutlineEye className="w-4 h-4 text-teal-500" />
                  {t.colorBlindMode}
                </label>
                <div className="space-y-2">
                  {Object.entries(colorBlindFilters).map(([key]) => (
                    <motion.button
                      key={key}
                      className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-all ${
                        colorBlindMode === key
                          ? 'bg-teal-500 text-white shadow-md'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => changeColorBlindMode(key)}
                    >
                      {filterNames[key] || key}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
