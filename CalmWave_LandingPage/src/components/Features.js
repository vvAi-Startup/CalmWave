'use client';

import FeatureCard from './FeatureCard';
import { HiOutlineBolt, HiOutlinePuzzlePiece, HiOutlineLockClosed } from 'react-icons/hi2';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { translations } from '@/locales/translations';

export default function Features() {
  const { language } = useAccessibility();
  const t = translations[language].features;

  const features = [
    {
      icon: HiOutlineBolt,
      title: t.realTime.title,
      description: t.realTime.description
    },
    {
      icon: HiOutlinePuzzlePiece,
      title: t.integration.title,
      description: t.integration.description
    },
    {
      icon: HiOutlineLockClosed,
      title: t.security.title,
      description: t.security.description
    }
  ];

  return (
    <section id="recursos" className="bg-[#FEFDFA] py-20" role="region" aria-labelledby="recursos-title">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 id="recursos-title" style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold mb-4">{t.title}</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg max-w-2xl mx-auto">
            {t.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
