import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PAYMENT_METHODS } from '@/lib/constants';
import { Bike } from 'lucide-react';

const DeliveryStatusForm = ({ 
    paymentMethod, setPaymentMethod,
    delivererName, setDelivererName
}) => {
  
  return (
    <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center"><Bike className="mr-2 text-primary" /> Detalhes da Entrega e Pagamento</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
                <SelectTrigger id="paymentMethod"><SelectValue placeholder="Selecione a forma de pgto." /></SelectTrigger>
                <SelectContent>
                    {PAYMENT_METHODS.map(pm => <SelectItem key={pm.id} value={pm.id}>{pm.name}</SelectItem>)}
                </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="delivererName">Nome do Entregador</Label>
            <Input
              id="delivererName"
              type="text"
              value={delivererName || ''}
              onChange={(e) => setDelivererName(e.target.value)}
              placeholder="Digite o nome do entregador"
              className="bg-background/70"
            />
            <p className="text-xs text-muted-foreground">
              Nome que aparecerá no cupom de entrega (opcional)
            </p>
          </div>
        </CardContent>
    </Card>
  );
};

export default DeliveryStatusForm;