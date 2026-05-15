'use client';

import { motion } from 'framer-motion';

export default function BenefitCard({ icon: Icon, title, description, index = 0 }) {
  return (
    <motion.div 
      className="bg-white/10 backdrop-blur-sm border border-white/20 p-6 rounded-2xl cursor-pointer"
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: "easeOut"
      }}
      whileHover={{ 
        scale: 1.05,
        backgroundColor: "rgba(255, 255, 255, 0.25)",
        boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)"
      }}
      role="article"
    >
      <motion.div 
        className="w-12 h-12 mb-4"
        initial={{ scale: 0, rotate: -180 }}
        whileInView={{ scale: 1, rotate: 0 }}
        viewport={{ once: true }}
        transition={{ 
          delay: index * 0.1 + 0.2,
          type: "spring",
          stiffness: 200
        }}
        whileHover={{ 
          scale: 1.2,
          rotate: 360
        }}
      >
        <Icon className="w-full h-full" aria-hidden="true" />
      </motion.div>
      <motion.h3 
        className="text-xl font-bold mb-2"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.3 }}
      >
        {title}
      </motion.h3>
      <motion.p 
        className="text-teal-50"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ delay: index * 0.1 + 0.4 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
