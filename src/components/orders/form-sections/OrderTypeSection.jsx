import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Truck, Coffee } from 'lucide-react';

const OrderTypeSection = ({ 
  tipoPedido, 
  setTipoPedido, 
  numeroMesa, 
  setNumeroMesa 
}) => {
  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <h3 className="text-lg font-semibold text-primary">Tipo de Pedido</h3>
      
      <RadioGroup value={tipoPedido} onValueChange={setTipoPedido}>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="delivery" id="delivery" />
            <Label 
              htmlFor="delivery" 
              className="flex items-center gap-2 cursor-pointer"
            >
              <Truck className="h-4 w-4" />
              Delivery
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="mesa" id="mesa" />
            <Label 
              htmlFor="mesa" 
              className="flex items-center gap-2 cursor-pointer"
            >
              <Coffee className="h-4 w-4" />
              Mesa
            </Label>
          </div>
        </div>
      </RadioGroup>
      
      {tipoPedido === 'mesa' && (
        <div className="grid gap-2 animate-in slide-in-from-top duration-200">
          <Label htmlFor="numero-mesa" className="text-sm">
            Número da Mesa <span className="text-red-500">*</span>
          </Label>
          <Input
            id="numero-mesa"
            type="number"
            min="1"
            placeholder="Ex: 5"
            value={numeroMesa}
            onChange={(e) => setNumeroMesa(e.target.value)}
            className="max-w-xs"
            required
          />
        </div>
      )}
    </div>
  );
};

export default OrderTypeSection; 