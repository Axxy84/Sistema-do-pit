import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

// Configuração das bordas disponíveis
export const PIZZA_BORDERS = [
  { id: 'none', name: 'Nenhuma', price: 0 },
  { id: 'salty', name: 'Salgada (Catupiry)', price: 5.00 },
  { id: 'sweet', name: 'Doce (Chocolate)', price: 7.00 }
];

const PizzaBorderSelector = ({ value, onChange, disabled = false }) => {
  const selectedBorder = PIZZA_BORDERS.find(border => border.id === value) || PIZZA_BORDERS[0];

  return (
    <div className="space-y-2">
      <Label htmlFor="pizza-border">Borda Recheada</Label>
      <Select 
        value={value || 'none'} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="pizza-border" className="w-full">
          <SelectValue placeholder="Selecione a borda" />
        </SelectTrigger>
        <SelectContent>
          {PIZZA_BORDERS.map((border) => (
            <SelectItem key={border.id} value={border.id}>
              <div className="flex justify-between items-center w-full">
                <span>{border.name}</span>
                {border.price > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (+{formatCurrency(border.price)})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedBorder.price > 0 && (
        <p className="text-sm text-muted-foreground">
          Adicional de {formatCurrency(selectedBorder.price)} pela borda {selectedBorder.name.toLowerCase()}
        </p>
      )}
    </div>
  );
};

export default PizzaBorderSelector; 