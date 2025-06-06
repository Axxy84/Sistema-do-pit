import React from 'react';
import { Calculator } from 'lucide-react';

const TonyBanner = () => {
  return (
    <div className="bg-slate-800/60 border-l-4 border-red-500 p-4 mb-6 h-12 flex items-center backdrop-blur-sm">
      <Calculator className="h-5 w-5 text-red-400 mr-3" />
      <p className="text-sm text-gray-200">
        <span className="font-medium text-red-400">Centro Financeiro ativo!</span> Controle suas despesas e monitore lucros em tempo real.
      </p>
    </div>
  );
};

export default TonyBanner;