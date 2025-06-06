import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Truck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const DeliveryFeeInput = ({ value, onChange, disabled = false }) => {
  const handleChange = (e) => {
    const inputValue = e.target.value.replace(/[^\d,]/g, '').replace(',', '.');
    const numericValue = parseFloat(inputValue) || 0;
    
    // Limitar a 2 casas decimais e valor máximo razoável
    if (numericValue <= 999.99) {
      onChange(numericValue);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="delivery-fee" className="flex items-center gap-2">
        <Truck className="h-4 w-4" />
        Taxa de Entrega
      </Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          R$
        </span>
        <Input
          id="delivery-fee"
          type="text"
          value={value > 0 ? value.toFixed(2).replace('.', ',') : ''}
          onChange={handleChange}
          placeholder="0,00"
          className="pl-10"
          disabled={disabled}
        />
      </div>
      {value > 0 && (
        <p className="text-sm text-muted-foreground">
          Taxa de entrega: {formatCurrency(value)}
        </p>
      )}
    </div>
  );
};

export default DeliveryFeeInput; 