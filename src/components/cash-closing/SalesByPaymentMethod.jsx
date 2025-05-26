import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const SalesByPaymentMethod = ({ salesByPaymentMethod, totalOrdersCount }) => {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-lg flex items-center"><CreditCard className="mr-2 text-indigo-500"/> Vendas por Forma de Pagamento</CardTitle>
      </CardHeader>
      <CardContent>
        {totalOrdersCount > 0 ? (
          <ul className="space-y-2">
            {Object.values(salesByPaymentMethod).filter(pm => pm.count > 0).map(pm => (
              <li key={pm.name} className="flex justify-between items-center text-sm p-2 rounded-md bg-muted/50">
                <span>{pm.name} ({pm.count} pedidos):</span>
                <span className="font-semibold">{formatCurrency(pm.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-center">Nenhuma venda registrada para esta data.</p>
        )}
        <p className="text-right font-bold mt-2">Total de Pedidos (Entregues): {totalOrdersCount}</p>
      </CardContent>
    </Card>
  );
};

export default SalesByPaymentMethod;