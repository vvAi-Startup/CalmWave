'use client';

import ProcessStep from './ProcessStep';
import { HiOutlineMicrophone, HiOutlineCpuChip, HiOutlineCheckCircle } from 'react-icons/hi2';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { translations } from '@/locales/translations';

export default function HowItWorks() {
  const { language } = useAccessibility();
  const t = translations[language].howItWorks;

  const steps = [
    {
      number: 1,
      icon: HiOutlineMicrophone,
      title: t.step1.title,
      description: t.step1.description,
      showLine: true
    },
    {
      number: 2,
      icon: HiOutlineCpuChip,
      title: t.step2.title,
      description: t.step2.description,
      showLine: true
    },
    {
      number: 3,
      icon: HiOutlineCheckCircle,
      title: t.step3.title,
      description: t.step3.description,
      showLine: false
    }
  ];

  return (
    <section id="como-funciona" className="py-20 bg-white" role="region" aria-labelledby="como-funciona-title">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 id="como-funciona-title" style={{ color: 'var(--text-primary)' }} className="text-4xl font-bold mb-4">{t.title}</h2>
          <p style={{ color: 'var(--text-secondary)' }} className="text-lg">
            {t.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <ProcessStep key={step.number} {...step} />
          ))}
        </div>
      </div>
    </section>
  );
}
