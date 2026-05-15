'use client';

import { motion } from 'framer-motion';

export default function ProcessStep({ number, icon: Icon, title, description, showLine = false }) {
  return (
    <motion.div 
      className="text-center group"
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ 
        duration: 0.6, 
        delay: (number - 1) * 0.2,
        type: "spring",
        stiffness: 100
      }}
    >
      <div className="relative mb-8">
        <motion.div 
          style={{ backgroundColor: 'var(--primary)' }}
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center mx-auto shadow-xl"
          whileHover={{ 
            scale: 1.15,
            rotate: 360,
            boxShadow: "0 25px 50px rgba(20, 184, 166, 0.4)"
          }}
          transition={{ 
            type: "spring",
            stiffness: 260,
            damping: 20
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: (number - 1) * 0.2 + 0.3, type: "spring" }}
          >
            <Icon className="w-10 h-10 text-white mb-1" aria-hidden="true" />
          </motion.div>
          <motion.span 
            className="text-sm font-bold text-white"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: (number - 1) * 0.2 + 0.4 }}
          >
            {number}
          </motion.span>
        </motion.div>
        {showLine && (
          <motion.div 
            style={{ backgroundColor: 'var(--primary-border)' }}
            className="hidden md:block absolute top-12 left-[60%] w-full h-1"
            initial={{ scaleX: 0, originX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: (number - 1) * 0.2 + 0.5 }}
          />
        )}
      </div>
      <motion.h3 
        style={{ color: 'var(--text-primary)' }}
        className="text-xl font-bold mb-3"
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: (number - 1) * 0.2 + 0.4 }}
      >
        {title}
      </motion.h3>
      <motion.p 
        style={{ color: 'var(--text-secondary)' }}
        className=""
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: (number - 1) * 0.2 + 0.5 }}
      >
        {description}
      </motion.p>
    </motion.div>
  );
}
