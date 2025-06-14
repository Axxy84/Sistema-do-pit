import React from 'react';
import TonyPageWrapper from '@/components/tony/TonyPageWrapper';


const TonyPage = () => {
  console.log('💰 TonyPage - Centro Financeiro carregado');

  return (
    <div
      className="min-h-screen w-full"
    >
      <TonyPageWrapper />
    </div>
  );
};

export default TonyPage;