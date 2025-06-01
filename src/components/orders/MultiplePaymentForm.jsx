import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Plus, Trash2, CreditCard, DollarSign, Smartphone } from 'lucide-react';
import { PAYMENT_METHODS } from '@/lib/constants';
import { formatCurrency } from '@/lib/utils';

const MultiplePaymentForm = ({ 
  totalValue, 
  onPaymentsChange, 
  initialPayments = [], 
  isMultipleEnabled = false,
  onMultipleToggle
}) => {
  const [payments, setPayments] = useState([]);
  const [isMultiple, setIsMultiple] = useState(isMultipleEnabled);

  // Inicializar com pagamentos existentes ou um pagamento padrão
  useEffect(() => {
    if (initialPayments.length > 0) {
      setPayments(initialPayments);
      setIsMultiple(initialPayments.length > 1);
    } else if (isMultiple) {
      setPayments([
        { id: 1, forma_pagamento: 'dinheiro', valor: '', observacoes: '' }
      ]);
    } else {
      setPayments([
        { id: 1, forma_pagamento: 'dinheiro', valor: totalValue, observacoes: '' }
      ]);
    }
  }, [initialPayments, totalValue, isMultiple]);

  // Atualizar quando totalValue mudar
  useEffect(() => {
    if (!isMultiple && payments.length === 1) {
      const updatedPayments = [{
        ...payments[0],
        valor: totalValue
      }];
      setPayments(updatedPayments);
      onPaymentsChange(updatedPayments);
    }
  }, [totalValue, isMultiple, payments.length]);

  const handleMultipleToggle = useCallback((enabled) => {
    setIsMultiple(enabled);
    if (enabled) {
      // Mudando para múltiplos pagamentos
      setPayments([
        { id: 1, forma_pagamento: 'dinheiro', valor: '', observacoes: '' }
      ]);
    } else {
      // Mudando para pagamento único
      setPayments([
        { id: 1, forma_pagamento: 'dinheiro', valor: totalValue, observacoes: '' }
      ]);
    }
    onMultipleToggle(enabled);
  }, [totalValue, onMultipleToggle]);

  const addPayment = useCallback(() => {
    const newPayment = {
      id: Date.now(),
      forma_pagamento: 'dinheiro',
      valor: '',
      observacoes: ''
    };
    const updatedPayments = [...payments, newPayment];
    setPayments(updatedPayments);
    onPaymentsChange(updatedPayments);
  }, [payments, onPaymentsChange]);

  const removePayment = useCallback((id) => {
    if (payments.length <= 1) return; // Sempre manter pelo menos um
    const updatedPayments = payments.filter(p => p.id !== id);
    setPayments(updatedPayments);
    onPaymentsChange(updatedPayments);
  }, [payments, onPaymentsChange]);

  const updatePayment = useCallback((id, field, value) => {
    const updatedPayments = payments.map(payment => 
      payment.id === id 
        ? { ...payment, [field]: value }
        : payment
    );
    setPayments(updatedPayments);
    onPaymentsChange(updatedPayments);
  }, [payments, onPaymentsChange]);

  const calculateTotal = useCallback(() => {
    return payments.reduce((sum, payment) => {
      const value = parseFloat(payment.valor) || 0;
      return sum + value;
    }, 0);
  }, [payments]);

  const calculateRemaining = useCallback(() => {
    return totalValue - calculateTotal();
  }, [totalValue, calculateTotal]);

  const isValidTotal = useCallback(() => {
    return Math.abs(calculateRemaining()) < 0.01; // Tolerância para decimais
  }, [calculateRemaining]);

  const getPaymentMethodIcon = (method) => {
    switch (method) {
      case 'dinheiro':
        return <DollarSign className="h-4 w-4" />;
      case 'cartao':
        return <CreditCard className="h-4 w-4" />;
      case 'pix':
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Forma de Pagamento</CardTitle>
          <div className="flex items-center space-x-2">
            <Label htmlFor="multiple-payment" className="text-sm">
              Múltiplas formas
            </Label>
            <Switch
              id="multiple-payment"
              checked={isMultiple}
              onCheckedChange={handleMultipleToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumo dos valores */}
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Pedido</div>
            <div className="font-semibold text-primary">{formatCurrency(totalValue)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Total Pago</div>
            <div className={`font-semibold ${isValidTotal() ? 'text-green-600' : 'text-orange-600'}`}>
              {formatCurrency(calculateTotal())}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Restante</div>
            <div className={`font-semibold ${isValidTotal() ? 'text-green-600' : calculateRemaining() > 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(Math.abs(calculateRemaining()))}
            </div>
          </div>
        </div>

        {/* Validação */}
        {!isValidTotal() && (
          <div className={`flex items-center gap-2 p-3 rounded-lg ${
            calculateRemaining() > 0 ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
          }`}>
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">
              {calculateRemaining() > 0 
                ? `Faltam ${formatCurrency(calculateRemaining())} para completar o pagamento`
                : `Excesso de ${formatCurrency(Math.abs(calculateRemaining()))} no pagamento`
              }
            </span>
          </div>
        )}

        {/* Lista de pagamentos */}
        <div className="space-y-3">
          {payments.map((payment, index) => (
            <div key={payment.id} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Forma de pagamento */}
                <div>
                  <Label className="text-sm font-medium">Forma</Label>
                  <Select 
                    value={payment.forma_pagamento} 
                    onValueChange={(value) => updatePayment(payment.id, 'forma_pagamento', value)}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(payment.forma_pagamento)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          <div className="flex items-center gap-2">
                            {getPaymentMethodIcon(method.id)}
                            {method.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Valor */}
                <div>
                  <Label className="text-sm font-medium">Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={payment.valor}
                    onChange={(e) => updatePayment(payment.id, 'valor', e.target.value)}
                    disabled={!isMultiple && payments.length === 1}
                  />
                </div>

                {/* Observações */}
                <div>
                  <Label className="text-sm font-medium">Observações</Label>
                  <Input
                    placeholder="Observações (opcional)"
                    value={payment.observacoes}
                    onChange={(e) => updatePayment(payment.id, 'observacoes', e.target.value)}
                  />
                </div>
              </div>

              {/* Ações */}
              {isMultiple && (
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  {payments.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removePayment(payment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Botão para adicionar novo pagamento */}
        {isMultiple && (
          <Button
            type="button"
            variant="outline"
            onClick={addPayment}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Forma de Pagamento
          </Button>
        )}

        {/* Resumo final */}
        {isMultiple && payments.length > 1 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <h4 className="font-semibold text-sm mb-2">Resumo do Pagamento:</h4>
            <div className="space-y-1">
              {payments.map((payment, index) => {
                const method = PAYMENT_METHODS.find(m => m.id === payment.forma_pagamento);
                const value = parseFloat(payment.valor) || 0;
                if (value <= 0) return null;
                
                return (
                  <div key={payment.id} className="flex justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {getPaymentMethodIcon(payment.forma_pagamento)}
                      {method?.name}
                      {payment.observacoes && <span className="text-muted-foreground">({payment.observacoes})</span>}
                    </span>
                    <span className="font-medium">{formatCurrency(value)}</span>
                  </div>
                );
              })}
              <div className="border-t pt-1 mt-1">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total:</span>
                  <span className={isValidTotal() ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MultiplePaymentForm; 