import React from 'react';
import TonyPageWrapper from '@/components/tony/TonyPageWrapper';
import { motion } from 'framer-motion';

const TonyPage = () => {
  console.log('💰 TonyPage - Centro Financeiro carregado');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen w-full"
    >
      <TonyPageWrapper />
    </motion.div>
  );
};

export default TonyPage;