import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';

const RealBorderSelector = ({ value, onChange, allProductsData, disabled = false }) => {
  // Filtrar apenas bordas reais do banco
  const availableBorders = [
    { id: 'none', nome: 'Sem Borda', preco_unitario: 0 },
    ...allProductsData.filter(p => p.tipo_produto === 'borda' && p.ativo)
  ];

  const selectedBorder = availableBorders.find(border => border.id === value || border.nome === value) || availableBorders[0];

  return (
    <div className="space-y-2">
      <Label htmlFor="pizza-border" className="text-sm font-medium flex items-center gap-2">
        <span className="text-lg">🥖</span>
        Borda Recheada
      </Label>
      <Select 
        value={value || 'none'} 
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="pizza-border" className="w-full">
          <SelectValue placeholder="Selecione a borda" />
        </SelectTrigger>
        <SelectContent>
          {availableBorders.map((border) => (
            <SelectItem key={border.id || border.nome} value={border.id || border.nome}>
              <div className="flex justify-between items-center w-full">
                <span>{border.nome}</span>
                {border.preco_unitario > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (+{formatCurrency(border.preco_unitario)})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedBorder.preco_unitario > 0 && (
        <p className="text-sm text-muted-foreground">
          Adicional de {formatCurrency(selectedBorder.preco_unitario)} pela borda {selectedBorder.nome}
        </p>
      )}
    </div>
  );
};

export default RealBorderSelector; 