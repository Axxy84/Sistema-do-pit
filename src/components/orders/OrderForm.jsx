import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import CustomerDetailsForm from './CustomerDetailsForm';
import OrderTypeSection from './form-sections/OrderTypeSection';
import PizzaItemsForm from './PizzaItemsForm';
import OtherItemsForm from './OtherItemsForm';
import DeliveryStatusForm from './DeliveryStatusForm';
import OrderTotalSummary from './OrderTotalSummary';
import CouponSection from './form-sections/CouponSection';
import PointsRedemptionSection from './form-sections/PointsRedemptionSection';
import { PAYMENT_METHODS, ORDER_STATUSES_GENERAL } from '@/lib/constants'; 
import customerService from '@/services/customerService';

const OrderForm = ({ isOpen, onOpenChange, onSubmit, initialOrderData, allProductsData, isSubmittingOrder }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  
  // Novos estados para tipo de pedido
  const [tipoPedido, setTipoPedido] = useState('delivery');
  const [numeroMesa, setNumeroMesa] = useState('');

  const [items, setItems] = useState([{ itemType: 'pizza', flavor: '', size: '', quantity: 1, unitPrice: 0, totalPrice: 0, productId: null }]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]?.id || '');
  const [orderStatus, setOrderStatus] = useState(ORDER_STATUSES_GENERAL.find(s => s.id === 'pendente')?.id || 'pendente'); 
  const [delivererId, setDelivererId] = useState(null); 
  
  const [subtotal, setSubtotal] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [pointsDiscountValue, setPointsDiscountValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  
  const [amountPaid, setAmountPaid] = useState(''); 
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [isDeliverersLoading, setIsDeliverersLoading] = useState(false); 

  const { toast } = useToast();
  const customerNameInputRef = useRef(null);

  const PONTOS_POR_REAL = 0.1; 
  const VALOR_REAL_POR_PONTO = 0.5; 

  const calculateTotals = useCallback(() => {
    const currentSubtotal = items.reduce((sum, item) => sum + (parseFloat(item.totalPrice) || 0), 0);
    setSubtotal(currentSubtotal);

    let currentCouponDiscount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.tipo_desconto === 'percentual') {
        currentCouponDiscount = (currentSubtotal * appliedCoupon.valor_desconto) / 100;
      } else {
        currentCouponDiscount = appliedCoupon.valor_desconto;
      }
    }
    setDiscountValue(currentCouponDiscount);
    
    let currentPointsDiscount = 0;
    const redeemablePoints = parseInt(pointsToRedeem, 10);
    if (!isNaN(redeemablePoints) && redeemablePoints > 0 && customerPoints >= redeemablePoints) {
        currentPointsDiscount = redeemablePoints * VALOR_REAL_POR_PONTO;
    }
    const maxPointsDiscount = Math.max(0, currentSubtotal - currentCouponDiscount);
    currentPointsDiscount = Math.min(currentPointsDiscount, maxPointsDiscount);
    setPointsDiscountValue(currentPointsDiscount);

    const finalTotal = Math.max(0, currentSubtotal - currentCouponDiscount - currentPointsDiscount);
    setTotalValue(finalTotal);
  }, [items, appliedCoupon, pointsToRedeem, customerPoints, VALOR_REAL_POR_PONTO]);

  useEffect(() => {
    calculateTotals();
  }, [items, appliedCoupon, pointsToRedeem, calculateTotals]);

  const resetFormFields = useCallback(() => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerId(null);
    setCustomerPoints(0);
    setTipoPedido('delivery');
    setNumeroMesa('');
    setItems([{ itemType: 'pizza', flavor: '', size: '', quantity: 1, unitPrice: 0, totalPrice: 0, productId: null }]);
    setOrderStatus(ORDER_STATUSES_GENERAL.find(s => s.id === 'pendente')?.id || 'pendente');
    setPaymentMethod(PAYMENT_METHODS[0]?.id || '');
    setDelivererId(null);
    setSubtotal(0);
    setDiscountValue(0);
    setPointsDiscountValue(0);
    setTotalValue(0);
    setAppliedCoupon(null);
    setPointsToRedeem('');
    setAmountPaid('');
    setIsCustomerLoading(false);
    setIsDeliverersLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (initialOrderData) {
            setCustomerName(initialOrderData.customerName || '');
            setCustomerPhone(initialOrderData.customerPhone || '');
            setCustomerAddress(initialOrderData.customerAddress || '');
            setCustomerId(initialOrderData.customerId || null);
            setDelivererId(initialOrderData.entregador_id?.id || initialOrderData.deliverer || null);
            
            // Inicializar tipo de pedido e número da mesa
            setTipoPedido(initialOrderData.tipo_pedido || 'delivery');
            setNumeroMesa(initialOrderData.numero_mesa ? initialOrderData.numero_mesa.toString() : '');
            
            if (initialOrderData.customerId) {
                fetchCustomerPoints(initialOrderData.customerId);
            } else {
                setCustomerPoints(0); 
            }

            const formattedItems = initialOrderData.items && initialOrderData.items.length > 0 
                ? initialOrderData.items.map(item => ({
                    ...item,
                    itemType: item.itemType || (item.flavor ? 'pizza' : 'other'),
                    unitPrice: parseFloat(item.unitPrice) || 0, 
                    totalPrice: parseFloat(item.totalPrice) || 0 
                }))
                : [{ itemType: 'pizza', flavor: '', size: '', quantity: 1, unitPrice: 0, totalPrice: 0, productId: null }];
            setItems(formattedItems);

            setOrderStatus(initialOrderData.status_pedido || (ORDER_STATUSES_GENERAL.find(s => s.id === 'pendente')?.id || 'pendente'));
            setPaymentMethod(initialOrderData.forma_pagamento || (PAYMENT_METHODS[0]?.id || ''));
            setAmountPaid(initialOrderData.valor_pago ? initialOrderData.valor_pago.toString() : '');
            
            if (initialOrderData.cupom_id && initialOrderData.cupom_codigo) {
                setAppliedCoupon({ 
                    id: initialOrderData.cupom_id, 
                    codigo: initialOrderData.cupom_codigo,
                    tipo_desconto: initialOrderData.cupom_tipo_desconto, 
                    valor_desconto: initialOrderData.cupom_valor_desconto 
                });
            } else {
                setAppliedCoupon(null);
            }

            if (initialOrderData.pontos_resgatados > 0) {
                setPointsToRedeem(initialOrderData.pontos_resgatados.toString());
            } else {
                setPointsToRedeem('');
            }
        } else {
            resetFormFields();
            setTimeout(() => customerNameInputRef.current?.focus(), 100);
        }
    }
  }, [initialOrderData, isOpen, resetFormFields]);

  const fetchCustomerByPhone = async () => {
    if (!customerPhone) return;
    setIsCustomerLoading(true);
    try {
      const cliente = await customerService.getByPhone(customerPhone);
      
      if (cliente) {
        setCustomerName(cliente.nome);
        setCustomerAddress(cliente.endereco || '');
        setCustomerId(cliente.id);
        setCustomerPoints(cliente.pontos_atuais || 0);
        toast({ title: 'Cliente Encontrado', description: `Dados de ${cliente.nome} carregados.` });
      }
    } catch (err) {
      if (err.message.includes('404') || err.message.includes('não encontrado')) {
        setCustomerAddress('');
        setCustomerId(null);
        setCustomerPoints(0);
        toast({ title: 'Cliente Não Encontrado', description: 'Você pode preencher os dados para um novo cadastro.', variant: 'default' });
      } else {
        toast({ title: 'Erro ao buscar cliente', description: err.message, variant: 'destructive' });
      }
    } finally {
      setIsCustomerLoading(false);
    }
  };
  
  const fetchCustomerPoints = async (cId) => {
    if (!cId) {
        setCustomerPoints(0);
        return;
    }
    try {
        const points = await customerService.getCustomerPoints(cId);
        setCustomerPoints(points || 0);
    } catch (err) {
        console.error("Erro ao buscar pontos do cliente:", err);
        setCustomerPoints(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      toast({ title: 'Erro de Validação', description: 'Nome e telefone do cliente são obrigatórios.', variant: 'destructive' });
      return;
    }
    
    // Validações baseadas no tipo de pedido
    if (tipoPedido === 'delivery' && !customerAddress) {
      toast({ title: 'Erro de Validação', description: 'Endereço é obrigatório para pedidos de delivery.', variant: 'destructive' });
      return;
    }
    if (tipoPedido === 'mesa' && !numeroMesa) {
      toast({ title: 'Erro de Validação', description: 'Número da mesa é obrigatório para pedidos de mesa.', variant: 'destructive' });
      return;
    }
    
    if (items.length === 0 || items.every(item => !item.productId && !item.flavor)) {
      toast({ title: 'Erro de Validação', description: 'Adicione pelo menos um item válido ao pedido.', variant: 'destructive' });
      return;
    }
    if (items.some(item => item.itemType === 'pizza' && (!item.flavor || !item.size || item.quantity < 1))) {
      toast({ title: 'Erro de Validação', description: 'Todas as pizzas devem ter sabor, tamanho e quantidade válidos.', variant: 'destructive' });
      return;
    }
    if (items.some(item => item.itemType !== 'pizza' && (!item.productId || item.quantity < 1))) {
         toast({ title: 'Erro de Validação', description: 'Todos os outros itens (bebidas, etc.) devem ser selecionados e ter quantidade válida.', variant: 'destructive' });
      return;
    }
 
    try {
      const parsedAmountPaid = parseFloat(amountPaid) || 0;
      const calculatedChange = parsedAmountPaid > totalValue ? parsedAmountPaid - totalValue : 0;
      
      const pontosGanhos = Math.floor(totalValue * PONTOS_POR_REAL); 
      const actualPointsRedeemed = pointsDiscountValue > 0 ? parseInt(pointsToRedeem, 10) : 0;

      await onSubmit({ 
        customerName,
        customerPhone,
        customerAddress: tipoPedido === 'delivery' ? customerAddress : null,
        customerId, // This will be null if a new customer, or the ID if existing
        tipo_pedido: tipoPedido,
        numero_mesa: tipoPedido === 'mesa' ? parseInt(numeroMesa, 10) : null,
        items,
        status_pedido: orderStatus,
        forma_pagamento: paymentMethod,
        entregador_id: delivererId, 
        subtotal,
        cupom_id: appliedCoupon?.id || null,
        desconto_aplicado: discountValue,
        pontos_resgatados: actualPointsRedeemed,
        total: totalValue, 
        pontos_ganhos: pontosGanhos,
        valor_pago: parsedAmountPaid, 
        troco_calculado: calculatedChange,
      });
    } catch (error) {
      // Error handling is primarily done by parent (OrdersPage)
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { 
        if (!isSubmittingOrder) { 
            onOpenChange(openState); 
        }
    }}>
      <DialogContent className="max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{initialOrderData ? 'Editar Pedido' : 'Registrar Novo Pedido'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do pedido. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4 max-h-[80vh] overflow-y-auto pr-2">
          <OrderTypeSection
            tipoPedido={tipoPedido}
            setTipoPedido={setTipoPedido}
            numeroMesa={numeroMesa}
            setNumeroMesa={setNumeroMesa}
          />
          
          <CustomerDetailsForm
            customerName={customerName}
            setCustomerName={setCustomerName}
            customerPhone={customerPhone}
            setCustomerPhone={setCustomerPhone}
            customerAddress={customerAddress}
            setCustomerAddress={setCustomerAddress}
            onPhoneBlur={fetchCustomerByPhone}
            isLoading={isCustomerLoading} 
            nameInputRef={customerNameInputRef}
            showAddress={tipoPedido === 'delivery'}
          />
          
          <PizzaItemsForm 
            items={items} 
            setItems={setItems} 
            allProductsData={allProductsData}
            onItemsChange={calculateTotals} 
          />

          <hr className="my-6 border-border/50"/>

          <OtherItemsForm
            items={items}
            setItems={setItems}
            allProductsData={allProductsData}
            onItemsChange={calculateTotals}
          />
          
          <DeliveryStatusForm
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            delivererId={delivererId}
            setDelivererId={setDelivererId}
            setIsDeliverersLoading={setIsDeliverersLoading} 
          />

          <CouponSection
            subtotal={subtotal}
            appliedCoupon={appliedCoupon}
            setAppliedCoupon={setAppliedCoupon}
            onCouponChange={calculateTotals} 
          />
          
          {customerId && ( // Only show points if customer is identified
            <PointsRedemptionSection
              customerId={customerId}
              customerPoints={customerPoints}
              pointsToRedeem={pointsToRedeem}
              setPointsToRedeem={setPointsToRedeem}
              subtotal={subtotal}
              couponDiscount={discountValue}
              valorRealPorPonto={VALOR_REAL_POR_PONTO}
              onPointsChange={calculateTotals}
            />
          )}

          <OrderTotalSummary 
            totalValue={totalValue} 
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
          />

          <DialogFooter className="mt-6 sticky bottom-0 bg-card py-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmittingOrder || isDeliverersLoading}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmittingOrder || isDeliverersLoading || isCustomerLoading}>
              {(isSubmittingOrder || isDeliverersLoading || isCustomerLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialOrderData ? 'Salvar Alterações' : 'Registrar Pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
