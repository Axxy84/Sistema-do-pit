import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, BadgePercent as TicketPercent, XCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatCurrency } from '@/lib/utils';

const CouponSection = ({ subtotal, appliedCoupon, setAppliedCoupon, onCouponChange }) => {
  const [couponCode, setCouponCode] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (appliedCoupon) {
      setCouponCode(appliedCoupon.codigo);
      setCouponMessage(`Cupom "${appliedCoupon.codigo}" aplicado.`);
    } else {
      setCouponCode('');
      setCouponMessage('');
    }
  }, [appliedCoupon]);

  const handleApplyCoupon = async () => {
    if (!couponCode) {
      setCouponMessage('Por favor, insira um código de cupom.');
      return;
    }
    setIsCouponLoading(true);
    setCouponMessage('');
    
    try {
      const { data: cupom, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', couponCode.toUpperCase())
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (!cupom) {
        setCouponMessage('Cupom inválido ou não encontrado.');
        toast({ title: 'Cupom Inválido', description: 'O código inserido não foi encontrado.', variant: 'destructive' });
        setAppliedCoupon(null); 
        onCouponChange();
        return;
      }
      if (!cupom.ativo) {
        setCouponMessage('Este cupom não está mais ativo.');
        toast({ title: 'Cupom Inativo', variant: 'destructive' });
        setAppliedCoupon(null);
        onCouponChange();
        return;
      }
      if (cupom.data_validade && new Date(cupom.data_validade) < new Date()) {
        setCouponMessage('Este cupom expirou.');
        toast({ title: 'Cupom Expirado', variant: 'destructive' });
        setAppliedCoupon(null);
        onCouponChange();
        return;
      }
      if (cupom.usos_maximos && cupom.usos_atuais >= cupom.usos_maximos) {
        setCouponMessage('Este cupom atingiu o limite de usos.');
        toast({ title: 'Limite de Usos Atingido', variant: 'destructive' });
        setAppliedCoupon(null);
        onCouponChange();
        return;
      }
      if (cupom.valor_minimo_pedido && subtotal < cupom.valor_minimo_pedido) {
        setCouponMessage(`Pedido mínimo de ${formatCurrency(cupom.valor_minimo_pedido)} para este cupom.`);
        toast({ title: 'Valor Mínimo Não Atingido', description: `O pedido deve ser de pelo menos ${formatCurrency(cupom.valor_minimo_pedido)}.`, variant: 'destructive' });
        setAppliedCoupon(null);
        onCouponChange();
        return;
      }

      setAppliedCoupon(cupom);
      setCouponMessage(`Cupom "${cupom.codigo}" aplicado com sucesso!`);
      toast({ title: 'Cupom Aplicado!', description: `Desconto de ${cupom.tipo_desconto === 'percentual' ? `${cupom.valor_desconto}%` : formatCurrency(cupom.valor_desconto)} adicionado.` });
      onCouponChange();

    } catch (err) {
      setCouponMessage('Erro ao validar cupom.');
      toast({ title: 'Erro ao Validar Cupom', description: err.message, variant: 'destructive' });
      setAppliedCoupon(null);
      onCouponChange();
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage('');
    onCouponChange();
    toast({ title: 'Cupom Removido' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md flex items-center"><TicketPercent className="mr-2 text-primary"/> Cupom de Desconto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-grow grid gap-1.5">
            <Label htmlFor="couponCode">Código do Cupom</Label>
            <Input id="couponCode" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Insira o código" disabled={!!appliedCoupon || isCouponLoading}/>
          </div>
          {!appliedCoupon ? (
            <Button type="button" onClick={handleApplyCoupon} disabled={isCouponLoading || !couponCode} className="h-10">
              {isCouponLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Aplicar"}
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={handleRemoveCoupon} className="h-10">
              <XCircle className="mr-2 h-4 w-4"/> Remover
            </Button>
          )}
        </div>
        {couponMessage && (
          <p className={`text-sm ${appliedCoupon ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center`}>
            {appliedCoupon ? <CheckCircle className="mr-1 h-4 w-4"/> : <XCircle className="mr-1 h-4 w-4"/>}
            {couponMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CouponSection;