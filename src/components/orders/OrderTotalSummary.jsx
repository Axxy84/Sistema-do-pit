import React from 'react';
import { DollarSign, ChevronsRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/utils';

const OrderTotalSummary = ({ totalValue, amountPaid, setAmountPaid }) => {
  const parsedAmountPaid = parseFloat(amountPaid);
  const change = !isNaN(parsedAmountPaid) && parsedAmountPaid > totalValue ? parsedAmountPaid - totalValue : 0;

  const handleAmountPaidChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmountPaid(value);
    }
  };
  
  return (
    <div className="mt-6 p-6 border rounded-lg bg-muted/30 shadow-sm space-y-6">
      <div className="text-center">
        <p className="text-sm font-medium text-muted-foreground">VALOR TOTAL DO PEDIDO</p>
        <p className="text-4xl font-extrabold text-green-600 dark:text-green-400 tracking-tight">
          {formatCurrency(totalValue)}
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="amount-paid" className="text-foreground/90 font-medium text-sm">Troco para (R$):</Label>
        <Input 
          id="amount-paid"
          type="text" 
          inputMode="decimal"
          placeholder="Ex: 50.00"
          value={amountPaid}
          onChange={handleAmountPaidChange}
          className="bg-background text-lg h-12 text-center focus:ring-2 focus:ring-primary"
        />
      </div>

      {amountPaid && !isNaN(parsedAmountPaid) && parsedAmountPaid >= totalValue && totalValue > 0 && (
        <div className="text-center pt-2">
          <p className="text-sm font-medium text-muted-foreground">TROCO</p>
          <p className={`text-3xl font-bold ${change > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`}>
            {formatCurrency(change)}
          </p>
        </div>
      )}
       {amountPaid && !isNaN(parsedAmountPaid) && parsedAmountPaid < totalValue && totalValue > 0 && (
        <div className="text-center pt-2">
            <p className="text-sm font-medium text-red-500">Valor pago é menor que o total do pedido.</p>
        </div>
      )}
    </div>
  );
};

export default OrderTotalSummary;