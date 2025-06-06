import React from 'react';

const InfoCard = ({ title, value, subtitle, icon: Icon, color = "text-red-400" }) => {
  return (
    <div className="bg-slate-800/80 backdrop-blur-sm shadow-xl rounded-xl p-5 flex items-center border border-slate-700/50 hover:bg-slate-800/90 transition-all duration-200">
      {Icon && (
        <div className={`mr-4 ${color}`}>
          <Icon className="h-8 w-8" />
        </div>
      )}
      <div className="flex-1">
        <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
          {title}
        </div>
        <div className="text-3xl font-bold text-white mb-1">
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-gray-500">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCard;