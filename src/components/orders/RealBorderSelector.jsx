import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { productService } from '@/services/productService';

const RealBorderSelector = ({ value, onChange, disabled = false }) => {
  const [borders, setBorders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBorders();
  }, []);

  const loadBorders = async () => {
    try {
      const allProducts = await productService.getAllActiveProducts();
      const bordasProducts = allProducts.filter(product => product.tipo_produto === 'borda');
      const bordasData = bordasProducts.map(product => ({
        id: product.id,
        nome: product.nome,
        preco_adicional: Number(product.preco_unitario) || 0
      }));
      setBorders(bordasData);
    } catch (error) {
      console.error('Erro ao carregar bordas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Adicionar a opção "Sem Borda" no início
  const availableBorders = [
    { id: 'none', nome: 'Sem Borda', preco_adicional: 0 },
    ...borders
  ];

  const selectedBorder = availableBorders.find(border => border.id === value) || availableBorders[0];

  return (
    <div className="space-y-2">
      <Label htmlFor="pizza-border" className="text-sm font-medium flex items-center gap-2">
        <span className="text-lg">🥖</span>
        Borda Recheada
      </Label>
      <Select 
        value={value || 'none'} 
        onValueChange={onChange}
        disabled={disabled || loading}
      >
        <SelectTrigger id="pizza-border" className="w-full">
          <SelectValue placeholder={loading ? "Carregando..." : "Selecione a borda"} />
        </SelectTrigger>
        <SelectContent>
          {availableBorders.map((border) => (
            <SelectItem key={border.id} value={border.id}>
              <div className="flex justify-between items-center w-full">
                <span>{border.nome}</span>
                {border.preco_adicional > 0 && (
                  <span className="text-sm text-muted-foreground ml-2">
                    (+{formatCurrency(border.preco_adicional)})
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedBorder && selectedBorder.preco_adicional > 0 && (
        <p className="text-sm text-muted-foreground">
          Adicional de {formatCurrency(selectedBorder.preco_adicional)} pela borda {selectedBorder.nome}
        </p>
      )}
    </div>
  );
};

export default RealBorderSelector;