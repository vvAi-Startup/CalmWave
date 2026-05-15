'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { HiChevronLeft, HiChevronRight } from 'react-icons/hi2';

export default function MobileCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const slides = [
    {
      image: '/imagens/HOME.png',
      alt: 'Tela principal do CalmWave'
    },
    {
      image: '/imagens/Gravador.png',
      alt: 'Gravador do CalmWave'
    },
    {
        image: '/imagens/Playlists.png',
        alt: 'Playlists do CalmWave'
    },
    {
      image: '/imagens/AUDIOS.png',
      alt: 'Audios do CalmWave'
    },
  ];

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.8
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="relative w-full h-[400px] overflow-hidden">
      {/* Efeito de fundo animado */}
      <motion.div 
        className="absolute inset-0 bg-teal-400/10 rounded-full blur-3xl -z-10"
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3]
        }}
        transition={{ 
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Carousel */}
      <div className="relative w-full h-full flex items-center justify-center">
        <AnimatePresence initial={false} custom={currentIndex}>
          <motion.div
            key={currentIndex}
            custom={currentIndex}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 }
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                nextSlide();
              } else if (swipe > swipeConfidenceThreshold) {
                prevSlide();
              }
            }}
            className="absolute w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
          >
            <motion.div 
              className="relative w-72 h-72 drop-shadow-2xl"
              animate={{ 
                y: [0, -10, 0],
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Image
                src={slides[currentIndex].image}
                fill
                style={{ objectFit: 'contain' }}
                alt={slides[currentIndex].alt}
                priority={currentIndex === 0}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Botões de navegação */}
        <button
          onClick={prevSlide}
          className="absolute left-2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Slide anterior"
        >
          <HiChevronLeft className="w-6 h-6 text-primary" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-2 z-10 bg-white/80 hover:bg-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Próximo slide"
        >
          <HiChevronRight className="w-6 h-6 text-primary" />
        </button>
      </div>

      {/* Indicadores de pontos */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex
                ? 'w-8 h-3 bg-[#14b8a6] hover:w-10'
                : 'w-3 h-3 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Ir para slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
