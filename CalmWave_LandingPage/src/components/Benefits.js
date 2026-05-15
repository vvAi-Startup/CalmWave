'use client';

import BenefitCard from './BenefitCard';
import { HiOutlineAcademicCap, HiOutlineChartBar, HiOutlineHeart, HiOutlineStar } from 'react-icons/hi2';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { translations } from '@/locales/translations';

export default function Benefits() {
  const { language } = useAccessibility();
  const t = translations[language].benefits;

  const benefits = [
    {
      icon: HiOutlineAcademicCap,
      title: t.focus.title,
      description: t.focus.description
    },
    {
      icon: HiOutlineChartBar,
      title: t.performance.title,
      description: t.performance.description
    },
    {
      icon: HiOutlineHeart,
      title: t.inclusion.title,
      description: t.inclusion.description
    },
    {
      icon: HiOutlineStar,
      title: t.confidence.title,
      description: t.confidence.description
    }
  ];

  return (
    <section
      id="beneficios"
      className="bg-teal-500 text-white py-20"
      role="region"
      aria-labelledby="beneficios-title"
    >
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fadeIn">
          <h2 id="beneficios-title" className="text-4xl font-bold mb-4">{t.title}</h2>
          <p className="text-teal-50 text-lg">
            {t.subtitle}
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
