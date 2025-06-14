import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Ticket, AlertTriangle, Search, PlusCircle, Edit2, Trash2, Loader2, Calendar, RotateCcw, Tag, BadgePercent, DollarSign, Users, CheckCircle, XCircle, Eye, EyeOff, Info } from 'lucide-react';

import { couponService } from '@/services/couponService';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';

const CouponForm = ({ isOpen, onOpenChange, onSubmit, initialCouponData, isLoading }) => {
  const [codigo, setCodigo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoDesconto, setTipoDesconto] = useState('percentual');
  const [valorDesconto, setValorDesconto] = useState('');
  const [dataValidade, setDataValidade] = useState('');
  const [usosMaximos, setUsosMaximos] = useState('');
  const [valorMinimoPedido, setValorMinimoPedido] = useState('');
  const [ativo, setAtivo] = useState(true);

  const { toast } = useToast();

  const resetFormFields = () => {
    setCodigo('');
    setDescricao('');
    setTipoDesconto('percentual');
    setValorDesconto('');
    setDataValidade('');
    setUsosMaximos('');
    setValorMinimoPedido('');
    setAtivo(true);
  };

  useEffect(() => {
    if (initialCouponData) {
      setCodigo(initialCouponData.codigo || '');
      setDescricao(initialCouponData.descricao || '');
      setTipoDesconto(initialCouponData.tipo_desconto || 'percentual');
      setValorDesconto(initialCouponData.valor_desconto?.toString() || '');
      setDataValidade(initialCouponData.data_validade ? new Date(initialCouponData.data_validade).toISOString().slice(0, 16) : '');
      setUsosMaximos(initialCouponData.usages_maximos?.toString() || '');
      setValorMinimoPedido(initialCouponData.valor_minimo_pedido?.toString() || '');
      setAtivo(initialCouponData.ativo === undefined ? true : initialCouponData.ativo);
    } else {
      resetFormFields();
    }
  }, [initialCouponData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!codigo || !tipoDesconto || !valorDesconto) {
      toast({ title: 'Erro de Validação', description: 'Código, Tipo e Valor do Desconto são obrigatórios.', variant: 'destructive' });
      return;
    }
    if (parseFloat(valorDesconto) <= 0) {
      toast({ title: 'Erro de Validação', description: 'Valor do desconto deve ser positivo.', variant: 'destructive' });
      return;
    }
    if (tipoDesconto === 'percentual' && (parseFloat(valorDesconto) > 100)) {
      toast({ title: 'Erro de Validação', description: 'Desconto percentual não pode ser maior que 100%.', variant: 'destructive' });
      return;
    }

    onSubmit({
      codigo: codigo.toUpperCase(),
      descricao,
      tipo_desconto: tipoDesconto,
      valor_desconto: parseFloat(valorDesconto),
      data_validade: dataValidade ? new Date(dataValidade).toISOString() : null,
      usages_maximos: usosMaximos ? parseInt(usosMaximos, 10) : null,
      valor_minimo_pedido: valorMinimoPedido ? parseFloat(valorMinimoPedido) : null,
      ativo,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { onOpenChange(openState); if (!openState) resetFormFields(); }}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{initialCouponData ? 'Editar Cupom' : 'Adicionar Novo Cupom'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do cupom. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid gap-2">
            <Label htmlFor="coupon-code" className="text-foreground/80">Código do Cupom (Ex: PROMO10)</Label>
            <Input id="coupon-code" value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} required className="bg-background/70"/>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coupon-desc" className="text-foreground/80">Descrição (opcional)</Label>
            <Input id="coupon-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} className="bg-background/70"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="coupon-type" className="text-foreground/80">Tipo de Desconto</Label>
              <Select value={tipoDesconto} onValueChange={setTipoDesconto} required>
                <SelectTrigger id="coupon-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="valor_fixo">Valor Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coupon-value" className="text-foreground/80">Valor do Desconto</Label>
              <Input id="coupon-value" type="number" step="0.01" placeholder={tipoDesconto === 'percentual' ? "Ex: 10 (para 10%)" : "Ex: 5 (para R$5,00)"} value={valorDesconto} onChange={(e) => setValorDesconto(e.target.value)} required className="bg-background/70"/>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coupon-validity" className="text-foreground/80">Data de Validade (opcional)</Label>
            <div className="relative">
              <Input id="coupon-validity" type="datetime-local" value={dataValidade} onChange={(e) => setDataValidade(e.target.value)} className="bg-background/70 pr-8"/>
              <Calendar className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="coupon-max-uses" className="text-foreground/80">Usos Máximos (opcional)</Label>
              <Input id="coupon-max-uses" type="number" placeholder="Ex: 100" value={usosMaximos} onChange={(e) => setUsosMaximos(e.target.value)} className="bg-background/70"/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="coupon-min-order" className="text-foreground/80">Valor Mínimo Pedido (R$) (opcional)</Label>
              <Input id="coupon-min-order" type="number" step="0.01" placeholder="Ex: 50.00" value={valorMinimoPedido} onChange={(e) => setValorMinimoPedido(e.target.value)} className="bg-background/70"/>
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-2">
            <Switch id="coupon-active" checked={ativo} onCheckedChange={setAtivo} />
            <Label htmlFor="coupon-active" className="text-foreground/80">Cupom Ativo</Label>
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialCouponData ? 'Salvar Alterações' : 'Adicionar Cupom'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCoupon, setCurrentCoupon] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && userRole !== 'admin') {
      toast({ title: 'Acesso Negado', description: 'Você não tem permissão para acessar esta página.', variant: 'destructive'});
      navigate('/dashboard');
    }
  }, [userRole, authLoading, navigate, toast]);

  const fetchCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const couponsData = await couponService.getAllCoupons();
      setCoupons(couponsData);
    } catch (error) {
      toast({ 
        title: 'Erro ao carregar cupons', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setCurrentCoupon(null);
  };

  const handleFormOpenChange = useCallback((isOpen) => {
    setIsFormOpen(isOpen);
    if (!isOpen) resetForm();
  }, [resetForm]);

  const handleSaveCoupon = async (couponData) => {
    setIsLoading(true);
    try {
      if (currentCoupon && currentCoupon.id) {
        await couponService.updateCoupon(currentCoupon.id, couponData);
        toast({ title: 'Sucesso!', description: 'Cupom atualizado com sucesso.' });
      } else {
        await couponService.createCoupon(couponData);
        toast({ title: 'Sucesso!', description: 'Cupom criado com sucesso.' });
      }

      fetchCoupons();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: `Erro ao ${currentCoupon ? 'atualizar' : 'criar'} cupom`, 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((coupon) => {
    setCurrentCoupon(coupon);
    setIsFormOpen(true);
  }, []);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await couponService.deleteCoupon(id);
      toast({ title: 'Sucesso!', description: 'Cupom removido com sucesso.' });
      fetchCoupons();
    } catch (error) {
      toast({ 
        title: 'Erro ao remover cupom', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (coupon.descricao && coupon.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }
  if (userRole !== 'admin') {
     return null; 
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
              <Ticket className="mr-3 h-8 w-8 text-primary"/> Gerenciamento de Cupons
            </h1>
            <p className="text-muted-foreground">Crie e gerencie cupons de desconto para seus clientes.</p>
          </div>
          <Button 
            onClick={() => { setCurrentCoupon(null); setIsFormOpen(true); }}
            className="bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white shadow-md hover:shadow-lg transition-shadow"
            disabled={isLoading}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Cupom
          </Button>
        </div>

      <CouponForm
        isOpen={isFormOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleSaveCoupon}
        initialCouponData={currentCoupon}
        isLoading={isLoading}
      />

      <div className="relative w-full md:w-1/3 mb-4">
        <Input 
          type="search"
          placeholder="Buscar por código ou descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full bg-background/70"
        />
        <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {isLoading && coupons.length === 0 ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : !isLoading && filteredCoupons.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-card rounded-lg shadow-md">
          <AlertTriangle className="w-16 h-16 text-primary/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">Nenhum cupom encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente refinar sua busca ou " : "Comece adicionando um novo cupom."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-lg shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/20">
                <TableHead className="text-foreground/90">Código</TableHead>
                <TableHead className="text-foreground/90">Descrição</TableHead>
                <TableHead className="text-foreground/90">Tipo</TableHead>
                <TableHead className="text-right text-foreground/90">Valor</TableHead>
                <TableHead className="text-foreground/90">Validade</TableHead>
                <TableHead className="text-right text-foreground/90">Usos</TableHead>
                <TableHead className="text-right text-foreground/90">Mín. Pedido</TableHead>
                <TableHead className="text-center text-foreground/90">Ativo</TableHead>
                <TableHead className="text-right text-foreground/90">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {filteredCoupons.map((coupon) => (
                  <motion.tr 
                    key={coupon.id}
                    layout
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground">{coupon.codigo}</TableCell>
                    <TableCell className="text-foreground/90 text-sm max-w-xs truncate">{coupon.descricao || '-'}</TableCell>
                    <TableCell className="text-foreground/90">{coupon.tipo_desconto === 'percentual' ? 'Percentual' : 'Valor Fixo'}</TableCell>
                    <TableCell className="text-right text-foreground/90">{coupon.tipo_desconto === 'percentual' ? `${coupon.valor_desconto}%` : formatCurrency(coupon.valor_desconto)}</TableCell>
                    <TableCell className="text-foreground/90">{coupon.data_validade ? new Date(coupon.data_validade).toLocaleDateString('pt-BR') : 'Sem validade'}</TableCell>
                    <TableCell className="text-right text-foreground/90">{coupon.usages_atuais} / {coupon.usages_maximos || '∞'}</TableCell>
                    <TableCell className="text-right text-foreground/90">{formatCurrency(coupon.valor_minimo_pedido || 0)}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${coupon.ativo ? 'bg-green-500/20 text-green-700 dark:bg-green-700/30 dark:text-green-400' : 'bg-red-500/20 text-red-700 dark:bg-red-700/30 dark:text-red-400'}`}>
                        {coupon.ativo ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20" disabled={isLoading}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(coupon.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
            </TableBody>
            {filteredCoupons.length > 5 && <TableCaption>Total de {filteredCoupons.length} cupons.</TableCaption>}
          </Table>
        </div>
      )}
    </div>
  );
};

export default CouponsPage;