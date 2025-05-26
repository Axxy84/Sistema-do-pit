import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const InfoCard = ({ title, value, icon: Icon, color = "text-gray-500", isLarge = false }) => (
  <motion.div 
      className={`p-4 rounded-lg shadow-md bg-background/50 border ${isLarge ? 'lg:col-span-1' : ''}`}
      whileHover={{ scale: 1.03 }}
      transition={{ type: 'spring', stiffness: 300 }}
  >
    <div className="flex items-center justify-between">
      <p className={`text-sm font-medium text-muted-foreground ${isLarge ? 'text-base' : ''}`}>{title}</p>
      {Icon && <Icon className={`h-5 w-5 ${color} ${isLarge ? 'h-6 w-6' : ''}`} />}
    </div>
    <p className={`text-2xl font-bold ${color} ${isLarge ? 'text-3xl mt-1' : 'mt-1'}`}>{value}</p>
  </motion.div>
);

const CashFlowSummary = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <InfoCard title="Total de Vendas (Pedidos Entregues)" value={formatCurrency(summary.totalSales)} icon={TrendingUp} color="text-green-500" />
      <InfoCard title="Total Despesas Extras" value={formatCurrency(summary.totalExpenses)} icon={TrendingDown} color="text-red-500" />
      <InfoCard title="Total Receitas Extras" value={formatCurrency(summary.totalExtraRevenues)} icon={TrendingUp} color="text-blue-500" />
      <InfoCard title="Descontos Aplicados" value={formatCurrency(summary.totalDiscounts)} color="text-yellow-500" />
      <InfoCard title="Taxas de Entrega" value={formatCurrency(summary.totalDeliveryFees)} color="text-purple-500" />
      <InfoCard title="Valor Líquido em Caixa" value={formatCurrency(summary.netRevenue)} icon={DollarSign} color="text-primary" isLarge />
    </div>
  );
};

export default CashFlowSummary;