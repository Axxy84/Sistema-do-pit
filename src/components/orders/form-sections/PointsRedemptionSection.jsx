import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Gift, XCircle, CheckCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const PointsRedemptionSection = ({ 
  customerPoints, 
  pointsToRedeem, 
  setPointsToRedeem, 
  subtotal, 
  couponDiscount, 
  valorRealPorPonto,
  onPointsChange 
}) => {
  const [pointsRedeemMessage, setPointsRedeemMessage] = useState('');
  const [isPointsLoading, setIsPointsLoading] = useState(false); // Placeholder for future async ops
  const { toast } = useToast();
  const [currentPointsDiscountValue, setCurrentPointsDiscountValue] = useState(0);

  useEffect(() => {
    // Recalculate discount if pointsToRedeem changes
    const points = parseInt(pointsToRedeem, 10);
    if (!isNaN(points) && points > 0 && points <= customerPoints) {
      const discountFromPoints = points * valorRealPorPonto;
      const maxPossibleDiscount = Math.max(0, subtotal - couponDiscount);
      setCurrentPointsDiscountValue(Math.min(discountFromPoints, maxPossibleDiscount));
    } else {
      setCurrentPointsDiscountValue(0);
    }
  }, [pointsToRedeem, customerPoints, valorRealPorPonto, subtotal, couponDiscount]);


  const handleRedeemPoints = () => {
    const points = parseInt(pointsToRedeem, 10);
    if (isNaN(points) || points <= 0) {
        setPointsRedeemMessage("Insira uma quantidade válida de pontos.");
        toast({ title: "Pontos Inválidos", description: "Insira uma quantidade válida de pontos.", variant: "destructive" });
        return;
    }
    if (points > customerPoints) {
        setPointsRedeemMessage(`Você possui apenas ${customerPoints} pontos.`);
        toast({ title: "Pontos Insuficientes", description: `Você possui apenas ${customerPoints} pontos.`, variant: "destructive" });
        return;
    }
    
    const discountFromPoints = points * valorRealPorPonto;
    const maxPossibleDiscount = Math.max(0, subtotal - couponDiscount);

    if (discountFromPoints > maxPossibleDiscount) {
        setPointsRedeemMessage(`O desconto dos pontos (${formatCurrency(discountFromPoints)}) não pode exceder o valor restante do pedido (${formatCurrency(maxPossibleDiscount)}).`);
        toast({ title: "Desconto Excede Valor", description: `O desconto dos pontos não pode exceder o valor restante do pedido.`, variant: "destructive" });
        // Optionally, auto-adjust pointsToRedeem to max possible
        // const maxPointsToRedeem = Math.floor(maxPossibleDiscount / valorRealPorPonto);
        // setPointsToRedeem(maxPointsToRedeem.toString());
        // setPointsRedeemMessage(`Ajustado para ${maxPointsToRedeem} pontos.`);
        return;
    }
    
    setCurrentPointsDiscountValue(discountFromPoints);
    setPointsRedeemMessage(`${points} pontos aplicados! Desconto de ${formatCurrency(discountFromPoints)}.`);
    toast({ title: 'Pontos Aplicados!', description: `Desconto de ${formatCurrency(discountFromPoints)} adicionado.` });
    onPointsChange(); // Trigger recalculation in parent
  };

  const handleRemovePoints = () => {
    setPointsToRedeem('');
    setCurrentPointsDiscountValue(0);
    setPointsRedeemMessage('');
    onPointsChange(); // Trigger recalculation in parent
    toast({ title: 'Desconto por Pontos Removido' });
  };

  // Effect to clear message if points are cleared or become invalid
  useEffect(() => {
    const points = parseInt(pointsToRedeem, 10);
    if (isNaN(points) || points <= 0 || points > customerPoints) {
      if (currentPointsDiscountValue === 0 && pointsRedeemMessage.includes("aplicados")) {
         // Only clear if it was a success message and now it's invalid
         setPointsRedeemMessage('');
      }
    }
  }, [pointsToRedeem, customerPoints, currentPointsDiscountValue, pointsRedeemMessage]);


  if (customerPoints <= 0) {
    return null; // Don't show section if customer has no points
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-md flex items-center"><Gift className="mr-2 text-primary"/> Resgatar Pontos</CardTitle>
        <CardDescription>Você tem {customerPoints} pontos. Cada ponto vale {formatCurrency(valorRealPorPonto)}.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end gap-2">
          <div className="flex-grow grid gap-1.5">
            <Label htmlFor="pointsToRedeem">Pontos a Resgatar</Label>
            <Input 
              id="pointsToRedeem" 
              type="number" 
              value={pointsToRedeem} 
              onChange={(e) => {
                const val = e.target.value;
                // Allow empty or positive integers up to customerPoints
                if (val === '' || (/^\d+$/.test(val) && parseInt(val, 10) <= customerPoints && parseInt(val, 10) >=0) ) {
                  setPointsToRedeem(val);
                } else if (/^\d+$/.test(val) && parseInt(val, 10) > customerPoints) {
                  setPointsToRedeem(customerPoints.toString()); // Max out if user types more
                }
              }} 
              placeholder={`Máx: ${customerPoints}`} 
              disabled={currentPointsDiscountValue > 0 && pointsToRedeem !== '' || isPointsLoading}
              max={customerPoints}
              min="0"
            />
          </div>
          {!(currentPointsDiscountValue > 0 && pointsToRedeem !== '') ? (
            <Button type="button" onClick={handleRedeemPoints} disabled={isPointsLoading || !pointsToRedeem || parseInt(pointsToRedeem,10) <= 0}>
              {isPointsLoading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Resgatar"}
            </Button>
          ) : (
            <Button type="button" variant="destructive" onClick={handleRemovePoints}>
              <XCircle className="mr-2 h-4 w-4"/> Remover Pontos
            </Button>
          )}
        </div>
        {pointsRedeemMessage && (
          <p className={`text-sm ${(currentPointsDiscountValue > 0 && pointsToRedeem !== '') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} flex items-center`}>
            {(currentPointsDiscountValue > 0 && pointsToRedeem !== '') ? <CheckCircle className="mr-1 h-4 w-4"/> : <XCircle className="mr-1 h-4 w-4"/>}
            {pointsRedeemMessage}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PointsRedemptionSection;