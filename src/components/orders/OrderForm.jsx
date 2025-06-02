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
import { Loader2, UserPlus } from 'lucide-react';
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
import DeliveryFeeInput from './DeliveryFeeInput';
import MultiplePaymentForm from './MultiplePaymentForm';
import { PAYMENT_METHODS, ORDER_STATUSES_GENERAL } from '@/lib/constants'; 
import customerService from '@/services/customerService';

const OrderForm = ({ isOpen, onOpenChange, onSubmit, initialOrderData, allProductsData, isSubmittingOrder }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerId, setCustomerId] = useState(null);
  const [customerPoints, setCustomerPoints] = useState(0);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // Novos estados para tipo de pedido
  const [tipoPedido, setTipoPedido] = useState('delivery');
  const [numeroMesa, setNumeroMesa] = useState('');

  const [items, setItems] = useState([{ itemType: 'pizza', flavor: '', size: '', border: 'none', borderPrice: 0, quantity: 1, unitPrice: 0, totalPrice: 0, productId: null }]);
  
  // Estados para múltiplos pagamentos
  const [useMultiplePayments, setUseMultiplePayments] = useState(false);
  const [payments, setPayments] = useState([]);
  
  // Estados de pagamento único (para compatibilidade)
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]?.id || '');
  const [amountPaid, setAmountPaid] = useState(''); 
  
  const [orderStatus, setOrderStatus] = useState(ORDER_STATUSES_GENERAL.find(s => s.id === 'pendente')?.id || 'pendente'); 
  const [delivererName, setDelivererName] = useState(''); 
  
  const [subtotal, setSubtotal] = useState(0);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [discountValue, setDiscountValue] = useState(0);
  const [pointsDiscountValue, setPointsDiscountValue] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [pointsToRedeem, setPointsToRedeem] = useState('');
  
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);

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

    const finalTotal = Math.max(0, currentSubtotal - currentCouponDiscount - currentPointsDiscount + deliveryFee);
    setTotalValue(finalTotal);
  }, [items, appliedCoupon, pointsToRedeem, customerPoints, deliveryFee, VALOR_REAL_POR_PONTO]);

  // Função para validar múltiplos pagamentos
  const validateMultiplePayments = useCallback(() => {
    if (!useMultiplePayments) return true;
    
    const totalPaid = payments.reduce((sum, payment) => {
      return sum + (parseFloat(payment.valor) || 0);
    }, 0);
    
    return Math.abs(totalPaid - totalValue) < 0.01; // Tolerância para decimais
  }, [useMultiplePayments, payments, totalValue]);

  // Função para lidar com mudanças nos pagamentos
  const handlePaymentsChange = useCallback((newPayments) => {
    setPayments(newPayments);
    
    // Atualizar pagamento único para compatibilidade se houver apenas um pagamento
    if (newPayments.length === 1) {
      setPaymentMethod(newPayments[0].forma_pagamento);
      setAmountPaid(newPayments[0].valor?.toString() || '');
    }
  }, []);

  // Função para lidar com toggle de múltiplos pagamentos
  const handleMultipleToggle = useCallback((enabled) => {
    setUseMultiplePayments(enabled);
    
    if (!enabled) {
      // Se desabilitar múltiplos pagamentos, manter apenas o primeiro ou criar um novo
      const singlePayment = payments.length > 0 ? payments[0] : {
        id: 1,
        forma_pagamento: paymentMethod,
        valor: totalValue,
        observacoes: ''
      };
      
      setPayments([singlePayment]);
      setPaymentMethod(singlePayment.forma_pagamento);
      setAmountPaid(singlePayment.valor?.toString() || totalValue.toString());
    }
  }, [payments, paymentMethod, totalValue]);

  useEffect(() => {
    calculateTotals();
  }, [items, appliedCoupon, pointsToRedeem, deliveryFee, calculateTotals]);

  const resetFormFields = useCallback(() => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCustomerId(null);
    setCustomerPoints(0);
    setTipoPedido('delivery');
    setNumeroMesa('');
    setItems([{ itemType: 'pizza', flavor: '', size: '', border: 'none', borderPrice: 0, quantity: 1, unitPrice: 0, totalPrice: 0, productId: null }]);
    setOrderStatus(ORDER_STATUSES_GENERAL.find(s => s.id === 'pendente')?.id || 'pendente');
    setPaymentMethod(PAYMENT_METHODS[0]?.id || '');
    setDelivererName('');
    setSubtotal(0);
    setDeliveryFee(0);
    setDiscountValue(0);
    setPointsDiscountValue(0);
    setTotalValue(0);
    setAppliedCoupon(null);
    setPointsToRedeem('');
    setAmountPaid('');
    setUseMultiplePayments(false);
    setPayments([{
      id: 1,
      forma_pagamento: PAYMENT_METHODS[0]?.id || 'dinheiro',
      valor: '',
      observacoes: ''
    }]);
    setIsCustomerLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
        if (initialOrderData) {
            setCustomerName(initialOrderData.customerName || '');
            setCustomerPhone(initialOrderData.customerPhone || '');
            setCustomerAddress(initialOrderData.customerAddress || '');
            setCustomerId(initialOrderData.customerId || null);
            setDelivererName(initialOrderData.entregador_nome || '');
            
            // Inicializar tipo de pedido e número da mesa
            setTipoPedido(initialOrderData.tipo_pedido || 'delivery');
            setNumeroMesa(initialOrderData.numero_mesa ? initialOrderData.numero_mesa.toString() : '');
            
            // Inicializar múltiplos pagamentos
            const hasMultiplePayments = initialOrderData.multiplos_pagamentos || false;
            setUseMultiplePayments(hasMultiplePayments);
            
            if (hasMultiplePayments && initialOrderData.pagamentos && initialOrderData.pagamentos.length > 0) {
                const formattedPayments = initialOrderData.pagamentos.map((payment, index) => ({
                    id: payment.id || Date.now() + index,
                    forma_pagamento: payment.forma_pagamento || 'dinheiro',
                    valor: payment.valor?.toString() || '',
                    observacoes: payment.observacoes || ''
                }));
                setPayments(formattedPayments);
            } else {
                setPayments([{
                    id: 1,
                    forma_pagamento: initialOrderData.forma_pagamento || 'dinheiro',
                    valor: initialOrderData.valor_pago?.toString() || '',
                    observacoes: ''
                }]);
            }
            
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
            
            // Definir taxa de entrega
            setDeliveryFee(initialOrderData.taxa_entrega || 0);
        } else {
            resetFormFields();
            setTimeout(() => customerNameInputRef.current?.focus(), 100);
        }
    }
  }, [initialOrderData, isOpen, resetFormFields]);

  const fetchCustomerByPhone = async () => {
    if (!customerPhone) return;
    
    const cleanedPhone = customerPhone.replace(/\D/g, ''); // Remove todos não-dígitos
    if (!cleanedPhone || cleanedPhone.length < 8) {
        // Não mostrar erro, apenas não buscar se telefone for muito curto
        return;
    }

    setIsCustomerLoading(true);
    try {
      const cliente = await customerService.getByPhone(cleanedPhone);
      
      if (cliente) {
        setCustomerName(cliente.nome);
        setCustomerAddress(cliente.endereco || '');
        setCustomerId(cliente.id);
        setCustomerPoints(cliente.pontos_atuais || 0);
        setIsNewCustomer(false);
        toast({ title: 'Cliente Encontrado', description: `Dados de ${cliente.nome} carregados.` });
      }
    } catch (err) {
      console.log('[CustomerService] Cliente não encontrado, será cadastrado como novo');
      // Cliente não encontrado é normal para novos clientes
      setCustomerAddress('');
      setCustomerId(null);
      setCustomerPoints(0);
      setIsNewCustomer(true);
      // Não mostrar toast de erro para cliente não encontrado, é comportamento normal
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

    // Validação apenas do nome como obrigatório
    if (!customerName) {
      toast({ title: 'Erro de Validação', description: 'Nome do cliente é obrigatório.', variant: 'destructive' });
      return;
    }
    
    // Validar telefone apenas se fornecido
    const cleanedSubmitPhone = customerPhone ? customerPhone.replace(/\D/g, '') : '';
    
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

    // Validação de múltiplos pagamentos
    if (!validateMultiplePayments()) {
      toast({ 
        title: 'Erro de Validação', 
        description: 'A soma dos valores dos pagamentos deve ser igual ao total do pedido.', 
        variant: 'destructive' 
      });
      return;
    }
 
    try {
      const parsedAmountPaid = parseFloat(amountPaid) || 0;
      const calculatedChange = parsedAmountPaid > totalValue ? parsedAmountPaid - totalValue : 0;
      
      const pontosGanhos = Math.floor(totalValue * PONTOS_POR_REAL); 
      const actualPointsRedeemed = pointsDiscountValue > 0 ? parseInt(pointsToRedeem, 10) : 0;

      await onSubmit({ 
        customerName,
        customerPhone: cleanedSubmitPhone,
        customerAddress: tipoPedido === 'delivery' ? customerAddress : null,
        customerId, // This will be null if a new customer, or the ID if existing
        tipo_pedido: tipoPedido,
        numero_mesa: tipoPedido === 'mesa' ? parseInt(numeroMesa, 10) : null,
        items,
        status_pedido: orderStatus,
        forma_pagamento: paymentMethod,
        entregador_nome: delivererName,
        subtotal,
        taxa_entrega: deliveryFee,
        cupom_id: appliedCoupon?.id || null,
        desconto_aplicado: discountValue,
        pontos_resgatados: actualPointsRedeemed,
        total: totalValue, 
        pontos_ganhos: pontosGanhos,
        valor_pago: parsedAmountPaid, 
        troco_calculado: calculatedChange,
        // Dados de múltiplos pagamentos
        multiplos_pagamentos: useMultiplePayments,
        pagamentos: payments,
      });
    } catch (error) {
      // Error handling is primarily done by parent (OrdersPage)
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { 
        if (!isSubmittingOrder) { 
            onOpenChange(openState);
            if (!openState) {
              setIsNewCustomer(false);
            }
        }
    }}>
      <DialogContent className="max-w-3xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">
            {initialOrderData ? 'Editar Pedido' : 'Registrar Novo Pedido'}
            {isNewCustomer && (
              <span className="ml-2 text-sm text-green-600 font-normal flex items-center inline-flex">
                <UserPlus className="h-4 w-4 mr-1" />
                Novo Cliente
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            Preencha os detalhes do pedido. 
            {isNewCustomer && ' O cliente será cadastrado automaticamente ao salvar.'}
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
          
          {/* Seção de entrega apenas para delivery */}
          {tipoPedido === 'delivery' && (
            <DeliveryStatusForm
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              delivererName={delivererName}
              setDelivererName={setDelivererName}
            />
          )}

          {tipoPedido === 'delivery' && (
            <DeliveryFeeInput
              value={deliveryFee}
              onChange={setDeliveryFee}
            />
          )}

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

          <MultiplePaymentForm
            totalValue={totalValue}
            onPaymentsChange={handlePaymentsChange}
            initialPayments={payments}
            isMultipleEnabled={useMultiplePayments}
            onMultipleToggle={handleMultipleToggle}
          />

          <DialogFooter className="mt-6 sticky bottom-0 bg-card py-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmittingOrder}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isSubmittingOrder || isCustomerLoading}>
              {(isSubmittingOrder || isCustomerLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialOrderData ? 'Salvar Alterações' : 'Registrar Pedido'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OrderForm;
