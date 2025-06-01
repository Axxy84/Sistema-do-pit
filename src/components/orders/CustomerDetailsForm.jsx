import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { UserCircle, Phone, Home, Search, Loader2 } from 'lucide-react';

const CustomerDetailsForm = ({
  customerName, setCustomerName,
  customerPhone, setCustomerPhone,
  customerAddress, setCustomerAddress,
  onPhoneBlur,
  isLoading,
  nameInputRef, // Accept ref from parent
  showAddress = true // Novo prop com valor padrão
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center"><UserCircle className="mr-2 text-primary" /> Detalhes do Cliente</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="grid gap-2">
          <Label htmlFor="customerName">Nome do Cliente</Label>
          <Input 
            id="customerName" 
            ref={nameInputRef} // Assign ref to the input
            value={customerName} 
            onChange={(e) => setCustomerName(e.target.value)} 
            placeholder="Nome completo" 
            required 
            disabled={isLoading}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="customerPhone">Telefone</Label>
          <div className="flex items-center gap-2">
            <Input 
              id="customerPhone" 
              value={customerPhone} 
              onChange={(e) => setCustomerPhone(e.target.value)} 
              placeholder="(XX) XXXXX-XXXX" 
              type="tel" 
              required 
              disabled={isLoading}
              onBlur={onPhoneBlur}
              className="flex-grow"
            />
            <Button type="button" variant="outline" size="icon" onClick={onPhoneBlur} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        {showAddress && (
          <div className="grid gap-2 md:col-span-2 animate-in slide-in-from-top duration-200">
            <Label htmlFor="customerAddress">
              Endereço de Entrega <span className="text-red-500">*</span>
            </Label>
            <Input 
              id="customerAddress" 
              value={customerAddress} 
              onChange={(e) => setCustomerAddress(e.target.value)} 
              placeholder="Rua, Número, Bairro, Complemento" 
              disabled={isLoading}
              required
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CustomerDetailsForm;