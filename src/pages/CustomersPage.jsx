import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Users, AlertTriangle, Search, PlusCircle, Edit2, Trash2, Loader2, History, Award, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clientService } from '@/services/clientService';
import { orderService } from '@/services/orderService';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const CustomerForm = ({ isOpen, onOpenChange, onSubmit, initialCustomerData, isLoading }) => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const { toast } = useToast();

  const resetForm = () => {
    setNome('');
    setTelefone('');
    setEndereco('');
  };

  useEffect(() => {
    if (initialCustomerData) {
      setNome(initialCustomerData.nome || '');
      setTelefone(initialCustomerData.telefone || '');
      setEndereco(initialCustomerData.endereco || '');
    } else {
      resetForm();
    }
  }, [initialCustomerData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !telefone) {
      toast({ title: 'Erro de Validação', description: 'Nome e Telefone são obrigatórios.', variant: 'destructive' });
      return;
    }
    onSubmit({ nome, telefone, endereco });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { onOpenChange(openState); if (!openState) resetForm(); }}>
      <DialogContent className="sm:max-w-lg bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{initialCustomerData ? 'Editar Cliente' : 'Adicionar Cliente'}</DialogTitle>
          <DialogDescription>Preencha os dados do cliente.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="customer-name">Nome</Label>
            <Input id="customer-name" value={nome} onChange={(e) => setNome(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-phone">Telefone</Label>
            <Input id="customer-phone" type="tel" value={telefone} onChange={(e) => setTelefone(e.target.value)} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="customer-address">Endereço (opcional)</Label>
            <Textarea id="customer-address" value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isLoading}>Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialCustomerData ? 'Salvar Alterações' : 'Adicionar Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const CustomerDetailsModal = ({ isOpen, onOpenChange, customer, orders, points, isLoading }) => {
  if (!customer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl md:max-w-3xl lg:max-w-4xl bg-card max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center"><Users className="mr-2"/> Detalhes de {customer.nome}</DialogTitle>
          <DialogDescription>Informações completas, histórico de pedidos e pontos de fidelidade.</DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow overflow-y-auto p-1 pr-3">
          <Tabs defaultValue="info" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="history">Histórico de Pedidos ({orders?.length || 0})</TabsTrigger>
              <TabsTrigger value="points">Pontos ({points?.pontos_atuais || 0})</TabsTrigger>
            </TabsList>
            <TabsContent value="info">
              <Card>
                <CardHeader><CardTitle>Dados Cadastrais</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <p><strong className="text-foreground/80">Nome:</strong> {customer.nome}</p>
                  <p><strong className="text-foreground/80">Telefone:</strong> {customer.telefone}</p>
                  <p><strong className="text-foreground/80">Endereço:</strong> {customer.endereco || 'Não informado'}</p>
                  <p><strong className="text-foreground/80">Cliente desde:</strong> {new Date(customer.created_at).toLocaleDateString('pt-BR')}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history">
              <Card>
                <CardHeader><CardTitle className="flex items-center"><History className="mr-2"/> Histórico de Pedidos</CardTitle></CardHeader>
                <CardContent>
                  {isLoading && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                  {!isLoading && orders && orders.length > 0 ? (
                    <div className="max-h-96 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Itens</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {orders.map(order => (
                            <TableRow key={order.id}>
                              <TableCell>{new Date(order.data_pedido).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell>{formatCurrency(order.total)}</TableCell>
                              <TableCell>{order.status_pedido}</TableCell>
                              <TableCell className="text-right">{order.itens_pedido_count}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : !isLoading ? (
                    <p className="text-muted-foreground text-center p-4">Nenhum pedido encontrado para este cliente.</p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="points">
              <Card>
                <CardHeader><CardTitle className="flex items-center"><Award className="mr-2"/> Pontos de Fidelidade</CardTitle></CardHeader>
                <CardContent>
                  {isLoading && <div className="flex justify-center p-4"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                  {!isLoading && points ? (
                    <div className="text-center">
                      <p className="text-5xl font-bold text-primary">{points.pontos_atuais || 0}</p>
                      <p className="text-muted-foreground">pontos disponíveis</p>
                      <p className="text-xs text-muted-foreground mt-2">Última atualização: {new Date(points.updated_at).toLocaleString('pt-BR')}</p>
                    </div>
                  ) : !isLoading ? (
                     <p className="text-muted-foreground text-center p-4">Cliente ainda não possui registro de pontos.</p>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="mt-auto pt-4 border-t">
          <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState(null);
  const [selectedCustomerOrders, setSelectedCustomerOrders] = useState([]);
  const [selectedCustomerPoints, setSelectedCustomerPoints] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const { toast } = useToast();

  const fetchCustomers = useCallback(async () => {
    setIsLoading(true);
    try {
      const clientsData = await clientService.getAllClients();
      setCustomers(clientsData);
    } catch (error) {
      toast({ 
        title: 'Erro ao carregar clientes', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const fetchCustomerDetails = useCallback(async (customer) => {
    setIsLoadingDetails(true);
    try {
      // Buscar pedidos do cliente
      const ordersData = await orderService.getAllOrders({ cliente_id: customer.id });
      setSelectedCustomerOrders(ordersData.map(o => ({
        ...o, 
        itens_pedido_count: o.itens_pedido?.length || 0 
      })));

      // Buscar pontos do cliente
      const pointsData = await clientService.getClientPoints(customer.id);
      setSelectedCustomerPoints({ 
        pontos_atuais: pointsData, 
        updated_at: new Date() 
      });
    } catch (error) {
      toast({ 
        title: 'Erro ao carregar detalhes', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoadingDetails(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const resetForm = () => {
    setCurrentCustomer(null);
  };

  const handleSaveCustomer = async (customerData) => {
    setIsLoading(true);
    try {
      if (currentCustomer && currentCustomer.id) {
        await clientService.updateClient(currentCustomer.id, customerData);
        toast({ title: 'Sucesso!', description: 'Cliente atualizado com sucesso.' });
      } else {
        await clientService.createClient(customerData);
        toast({ title: 'Sucesso!', description: 'Cliente adicionado com sucesso.' });
      }
      
      fetchCustomers();
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast({ 
        title: `Erro ao ${currentCustomer ? 'atualizar' : 'adicionar'} cliente`, 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((customer) => {
    setCurrentCustomer(customer);
    setIsFormOpen(true);
  }, []);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      await clientService.deleteClient(id);
      toast({ title: 'Sucesso!', description: 'Cliente removido com sucesso.' });
      fetchCustomers();
    } catch (error) {
      toast({ 
        title: 'Erro ao remover cliente', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openDetailsModal = (customer) => {
    setSelectedCustomerDetails(customer);
    setIsDetailsModalOpen(true);
    fetchCustomerDetails(customer);
  };

  const filteredCustomers = customers.filter(customer =>
    customer.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.telefone && customer.telefone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center">
            <Users className="mr-3 h-8 w-8 text-primary"/> Gerenciamento de Clientes
          </h1>
          <p className="text-muted-foreground">Cadastre, edite e visualize informações dos seus clientes.</p>
        </div>
        <Button 
          onClick={() => { setCurrentCustomer(null); setIsFormOpen(true); }}
          className="bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white shadow-md hover:shadow-lg transition-shadow"
          disabled={isLoading}
        >
          <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Cliente
        </Button>
      </div>

      <CustomerForm
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleSaveCustomer}
        initialCustomerData={currentCustomer}
        isLoading={isLoading}
      />

      <CustomerDetailsModal
        isOpen={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        customer={selectedCustomerDetails}
        orders={selectedCustomerOrders}
        points={selectedCustomerPoints}
        isLoading={isLoadingDetails}
      />

      <div className="relative w-full md:w-1/3 mb-4">
        <Input 
          type="search"
          placeholder="Buscar por nome ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 w-full bg-background/70"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
      </div>

      {isLoading && customers.length === 0 ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : !isLoading && filteredCustomers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-card rounded-lg shadow-md">
          <AlertTriangle className="w-16 h-16 text-primary/50 mb-4" />
          <h3 className="text-xl font-semibold text-foreground">Nenhum cliente encontrado</h3>
          <p className="text-muted-foreground">
            {searchTerm ? "Tente refinar sua busca ou " : "Comece adicionando um novo cliente."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-lg shadow-md">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-muted/20">
                <TableHead className="text-foreground/90">Nome</TableHead>
                <TableHead className="text-foreground/90">Telefone</TableHead>
                <TableHead className="text-foreground/90">Endereço</TableHead>
                <TableHead className="text-right text-foreground/90">Pontos</TableHead>
                <TableHead className="text-right text-foreground/90">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredCustomers.map((customer) => (
                  <motion.tr 
                    key={customer.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium text-foreground">{customer.nome}</TableCell>
                    <TableCell className="text-foreground/90">{customer.telefone}</TableCell>
                    <TableCell className="text-foreground/90 text-sm max-w-xs truncate">{customer.endereco || '-'}</TableCell>
                    <TableCell className="text-right text-foreground/90 font-semibold text-amber-500">
                      {customer.clientes_pontos && customer.clientes_pontos.length > 0 ? customer.clientes_pontos[0].pontos_atuais : 0}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => openDetailsModal(customer)} className="text-green-500 hover:text-green-700 hover:bg-green-100/50 dark:hover:bg-green-700/20" disabled={isLoading}>
                        <ShoppingBag className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(customer)} className="text-blue-500 hover:text-blue-700 hover:bg-blue-100/50 dark:hover:bg-blue-700/20" disabled={isLoading}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(customer.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100/50 dark:hover:bg-red-700/20" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
            {filteredCustomers.length > 10 && <TableCaption>Total de {filteredCustomers.length} clientes.</TableCaption>}
          </Table>
        </div>
      )}
    </motion.div>
  );
};

export default CustomersPage;