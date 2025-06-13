import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2, Pizza, DollarSign, Ruler } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const PizzaSizeManager = ({ 
  tamanhosPrecos = [], 
  onChange, 
  pizzaSizes = [],
  pizzaIngredients = '',
  onIngredientsChange 
}) => {
  const [sizes, setSizes] = useState(tamanhosPrecos);

  useEffect(() => {
    setSizes(tamanhosPrecos.length > 0 ? tamanhosPrecos : [{ tamanho: '', preco: '', id_tamanho: '' }]);
  }, [tamanhosPrecos]);

  const handleSizeChange = (index, field, value) => {
    const newSizes = [...sizes];
    newSizes[index][field] = value;
    
    if (field === 'id_tamanho') {
      const selectedSize = pizzaSizes.find(s => s.id === value);
      newSizes[index]['tamanho'] = selectedSize ? selectedSize.name : '';
    }
    
    setSizes(newSizes);
    onChange(newSizes);
  };

  const addSize = () => {
    const newSizes = [...sizes, { tamanho: '', preco: '', id_tamanho: '' }];
    setSizes(newSizes);
    onChange(newSizes);
  };

  const removeSize = (index) => {
    const newSizes = sizes.filter((_, i) => i !== index);
    setSizes(newSizes);
    onChange(newSizes);
  };

  const getSizeIcon = (sizeId) => {
    const sizeMap = {
      'pequena': '🍕',
      'media': '🍕🍕',
      'grande': '🍕🍕🍕',
      'familia': '🍕🍕🍕🍕'
    };
    return sizeMap[sizeId] || '🍕';
  };

  const getSizeDiameter = (sizeId) => {
    const diameterMap = {
      'pequena': '25cm',
      'media': '30cm', 
      'grande': '35cm',
      'familia': '40cm'
    };
    return diameterMap[sizeId] || '?cm';
  };

  const calculateTotalRange = () => {
    const validPrices = sizes
      .filter(s => s.preco && parseFloat(s.preco) > 0)
      .map(s => parseFloat(s.preco));
    
    if (validPrices.length === 0) return null;
    
    const min = Math.min(...validPrices);
    const max = Math.max(...validPrices);
    
    return min === max ? formatCurrency(min) : `${formatCurrency(min)} - ${formatCurrency(max)}`;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
        <div className="p-2 bg-orange-100 rounded-full">
          <Pizza className="h-6 w-6 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Configuração de Tamanhos da Pizza</h3>
          <p className="text-sm text-gray-600">Configure os tamanhos disponíveis e seus respectivos preços</p>
        </div>
        {calculateTotalRange() && (
          <Badge variant="outline" className="ml-auto bg-green-50 text-green-700 border-green-200">
            Faixa: {calculateTotalRange()}
          </Badge>
        )}
      </div>

      {/* Ingredientes da Pizza */}
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-orange-200">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-yellow-100 rounded">
              <span className="text-lg">🍅</span>
            </div>
            <CardTitle className="text-base text-gray-700">Ingredientes da Pizza</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Ex: Molho de tomate, mussarela, manjericão, azeitonas..."
            value={pizzaIngredients}
            onChange={(e) => onIngredientsChange(e.target.value)}
            className="bg-white/80 border-orange-200 focus:border-orange-400"
          />
          <p className="text-xs text-gray-500 mt-1">Descreva os ingredientes que compõem esta pizza</p>
        </CardContent>
      </Card>

      {/* Tamanhos e Preços */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-blue-600" />
            <h4 className="font-medium text-gray-800">Tamanhos Disponíveis</h4>
          </div>
          <Button 
            type="button" 
            variant="outline" 
            size="sm" 
            onClick={addSize}
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Tamanho
          </Button>
        </div>

        <AnimatePresence>
          {sizes.map((size, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="overflow-hidden bg-gradient-to-r from-white to-gray-50 border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                    
                    {/* Seletor de Tamanho */}
                    <div className="md:col-span-5">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <span className="text-lg">{getSizeIcon(size.id_tamanho)}</span>
                        Tamanho da Pizza
                      </Label>
                      <Select 
                        value={size.id_tamanho} 
                        onValueChange={(val) => handleSizeChange(index, 'id_tamanho', val)}
                      >
                        <SelectTrigger className="bg-white border-gray-300 focus:border-orange-400">
                          <SelectValue placeholder="Escolha o tamanho" />
                        </SelectTrigger>
                        <SelectContent>
                          {pizzaSizes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              <div className="flex items-center gap-2">
                                <span>{getSizeIcon(s.id)}</span>
                                <span className="font-medium">{s.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {getSizeDiameter(s.id)}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Campo de Preço */}
                    <div className="md:col-span-4">
                      <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        Preço (R$)
                      </Label>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          value={size.preco}
                          onChange={(e) => handleSizeChange(index, 'preco', e.target.value)}
                          className="bg-white border-gray-300 focus:border-orange-400 pl-8"
                        />
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                          R$
                        </span>
                      </div>
                    </div>

                    {/* Preview do Preço */}
                    <div className="md:col-span-2">
                      {size.preco && parseFloat(size.preco) > 0 && (
                        <div className="text-center">
                          <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">
                            {formatCurrency(parseFloat(size.preco))}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Botão Remover */}
                    <div className="md:col-span-1 flex justify-end">
                      {sizes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSize(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Informações Adicionais do Tamanho */}
                  {size.id_tamanho && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <span>📏</span>
                          Diâmetro: {getSizeDiameter(size.id_tamanho)}
                        </span>
                        {size.preco && (
                          <span className="flex items-center gap-1">
                            <span>💰</span>
                            Preço por cm: {formatCurrency(parseFloat(size.preco) / parseInt(getSizeDiameter(size.id_tamanho)))}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Resumo dos Tamanhos */}
        {sizes.length > 1 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📊</span>
                <h5 className="font-medium text-gray-800">Resumo dos Tamanhos</h5>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {sizes
                  .filter(s => s.id_tamanho && s.preco)
                  .map((size, idx) => (
                    <div key={idx} className="text-center p-2 bg-white rounded border border-blue-200">
                      <div className="text-lg mb-1">{getSizeIcon(size.id_tamanho)}</div>
                      <div className="text-sm font-medium text-gray-700">{size.tamanho}</div>
                      <div className="text-xs text-green-600 font-medium">
                        {formatCurrency(parseFloat(size.preco))}
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PizzaSizeManager; 