import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  UtensilsCrossed, 
  Receipt, 
  Printer, 
  QrCode, 
  Clock, 
  DollarSign,
  Users,
  Search,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { mesaService, configurationService } from '@/services/mesaService';
import { productService } from '@/services/productService';
import { formatTableClosingTicketForPrint, generatePixQrCodeHTML } from '@/lib/printerUtils';
import { formatCurrency } from '@/lib/utils';

const MesasPage = () => {
  const [mesasAbertas, setMesasAbertas] = useState([]);
  const [mesaSelecionada, setMesaSelecionada] = useState(null);
  const [numeroMesaBusca, setNumeroMesaBusca] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [pixConfig, setPixConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMesas, setIsLoadingMesas] = useState(true);
  const [showFecharContaModal, setShowFecharContaModal] = useState(false);
  const [mesaParaFechar, setMesaParaFechar] = useState(null);
  const [formaPagamentoSelecionada, setFormaPagamentoSelecionada] = useState('dinheiro');
  const [showAdicionarItemModal, setShowAdicionarItemModal] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [produtoSelecionado, setProdutoSelecionado] = useState(null);
  const [quantidadeItem, setQuantidadeItem] = useState(1);
  const [isLoadingProdutos, setIsLoadingProdutos] = useState(false);
  const { toast } = useToast();

  // Carregar mesas abertas e configurações PIX
  useEffect(() => {
    loadMesasAbertas();
    loadPixConfig();
    
    // Escutar eventos de mudança de status de pedidos
    const handleOrderStatusChanged = (event) => {
      console.log('📡 Evento de mudança de status recebido:', event.detail);
      // Recarregar mesas quando status mudar
      loadMesasAbertas();
    };
    
    const handleOrderSaved = () => {
      console.log('📡 Evento de pedido salvo recebido');
      // Recarregar mesas quando pedido for salvo
      loadMesasAbertas();
    };
    
    window.addEventListener('orderStatusChanged', handleOrderStatusChanged);
    window.addEventListener('orderSaved', handleOrderSaved);
    
    return () => {
      window.removeEventListener('orderStatusChanged', handleOrderStatusChanged);
      window.removeEventListener('orderSaved', handleOrderSaved);
    };
  }, []);

  const loadMesasAbertas = async () => {
    try {
      setIsLoadingMesas(true);
      const response = await mesaService.getMesasAbertas();
      
      // O apiClient retorna os dados diretamente, não em response.data
      const mesas = response?.mesas || [];
      console.log('📋 Mesas carregadas:', mesas.length, mesas);
      
      setMesasAbertas(mesas);
    } catch (error) {
      console.error('❌ Erro ao carregar mesas:', error);
      
      // Se for erro de autenticação, não mostrar toast (já redireciona)
      if (error.message?.includes('401') || error.message?.includes('403')) {
        return;
      }
      
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao carregar mesas abertas',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingMesas(false);
    }
  };

  const loadPixConfig = async () => {
    try {
      const config = await configurationService.getPixConfigurations();
      setPixConfig(config);
    } catch (error) {
      console.error('Erro ao carregar configurações PIX:', error);
    }
  };

  const buscarMesa = async (numeroMesa) => {
    if (!numeroMesa) {
      toast({
        title: 'Atenção',
        description: 'Informe o número da mesa',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const data = await mesaService.getResumoMesa(numeroMesa);
      console.log('🔍 Resumo da mesa', numeroMesa, ':', data);
      
      if (data && data.mesa) {
        console.log('📊 Mesa carregada:', data.mesa);
        console.log('💵 Total:', data.mesa.total);
        setMesaSelecionada(data.mesa);
        toast({
          title: 'Mesa encontrada',
          description: `Mesa ${numeroMesa} carregada com sucesso`
        });
      } else {
        setMesaSelecionada(null);
        toast({
          title: 'Mesa não encontrada',
          description: 'Mesa não encontrada ou já fechada',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('❌ Erro ao buscar mesa:', error);
      setMesaSelecionada(null);
      
      // Extrair mensagem de erro mais específica
      const errorMessage = error.response?.data?.error || 
                          error.message || 
                          'Mesa não encontrada ou já fechada';
      
      toast({
        title: 'Mesa não encontrada',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const imprimirCupom = async (mesa) => {
    if (!mesa) return;

    try {
      const cupomContent = formatTableClosingTicketForPrint(mesa, pixConfig);
      
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      if (!printWindow) {
        toast({
          title: 'Erro de Impressão',
          description: 'Não foi possível abrir a janela de impressão',
          variant: 'destructive'
        });
        return;
      }

      printWindow.document.write('<html><head><title>Fechamento Mesa ' + mesa.numero_mesa + '</title>');
      printWindow.document.write('<style>body { font-family: monospace; font-size: 10pt; margin: 5px; } pre { white-space: pre-wrap; word-wrap: break-word; } </style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<pre>' + cupomContent + '</pre>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
      };

      toast({
        title: 'Cupom Gerado',
        description: `Cupom da mesa ${mesa.numero_mesa} preparado para impressão`
      });
    } catch (error) {
      toast({
        title: 'Erro na Impressão',
        description: 'Erro ao gerar cupom para impressão',
        variant: 'destructive'
      });
    }
  };

  const imprimirQrCodePix = (mesa) => {
    if (!mesa || !pixConfig?.pix_qr_code) {
      toast({
        title: 'PIX não configurado',
        description: 'Configure o QR Code PIX nas configurações do sistema',
        variant: 'destructive'
      });
      return;
    }

    try {
      const valor = parseFloat(mesa.total).toFixed(2);
      const pixHTML = generatePixQrCodeHTML(pixConfig.pix_qr_code, valor, mesa.numero_mesa);
      
      const printWindow = window.open('', '_blank', 'width=400,height=600');
      if (!printWindow) {
        toast({
          title: 'Erro de Impressão',
          description: 'Não foi possível abrir a janela de impressão',
          variant: 'destructive'
        });
        return;
      }

      printWindow.document.write(pixHTML);
      printWindow.document.close();
      
      printWindow.onload = function() {
        printWindow.focus();
        printWindow.print();
      };

      toast({
        title: 'QR Code PIX Gerado',
        description: `QR Code PIX da mesa ${mesa.numero_mesa} preparado para impressão`
      });
    } catch (error) {
      toast({
        title: 'Erro na Impressão',
        description: 'Erro ao gerar QR Code PIX',
        variant: 'destructive'
      });
    }
  };

  const abrirModalFecharConta = (mesa) => {
    console.log('🧾 Abrindo modal fechar conta:', mesa);
    console.log('💰 Total da mesa:', mesa?.total || mesa?.valor_total);
    setMesaParaFechar(mesa);
    setFormaPagamentoSelecionada('dinheiro');
    setShowFecharContaModal(true);
  };

  const fecharConta = async () => {
    if (!mesaParaFechar) return;

    try {
      setIsLoading(true);
      
      // Imprimir cupom antes de fechar
      await imprimirCupomMesa({ ...mesaParaFechar, observacoes });
      
      // Fechar conta
      await mesaService.fecharConta(
        mesaParaFechar.numero_mesa, 
        formaPagamentoSelecionada,
        observacoes
      );
      
      toast({
        title: 'Conta Fechada!',
        description: `Mesa ${mesaParaFechar.numero_mesa} foi fechada com sucesso`,
        duration: 5000
      });

      // Limpar e recarregar
      setShowFecharContaModal(false);
      setMesaParaFechar(null);
      setMesaSelecionada(null);
      setNumeroMesaBusca('');
      setObservacoes('');
      await loadMesasAbertas();
      
      // Disparar evento para atualizar outras telas
      window.dispatchEvent(new CustomEvent('orderStatusChanged', { 
        detail: { numeroMesa: mesaParaFechar.numero_mesa, newStatus: 'fechada' } 
      }));
      
    } catch (error) {
      toast({
        title: 'Erro ao Fechar Conta',
        description: error.response?.data?.error || 'Erro ao fechar conta da mesa',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fecharMesa = async (numeroMesa) => {
    if (!numeroMesa) return;

    try {
      setIsLoading(true);
      await mesaService.fecharMesa(numeroMesa, observacoes);
      
      toast({
        title: 'Mesa Fechada!',
        description: `Mesa ${numeroMesa} foi fechada com sucesso`
      });

      // Limpar formulário e recarregar listas
      setMesaSelecionada(null);
      setNumeroMesaBusca('');
      setObservacoes('');
      await loadMesasAbertas();
    } catch (error) {
      toast({
        title: 'Erro ao Fechar Mesa',
        description: error.response?.data?.error || 'Erro ao fechar mesa',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const loadProdutos = async () => {
    try {
      setIsLoadingProdutos(true);
      const produtosAtivos = await productService.getAllActiveProducts();
      console.log('🔍 Produtos carregados:', produtosAtivos.length);
      
      // Filtrar apenas bebidas e outros itens rápidos (não pizzas)
      const produtosFiltrados = produtosAtivos.filter(p => 
        p.tipo_produto !== 'pizza' && p.tipo_produto !== 'borda'
      );
      
      console.log('🥤 Produtos filtrados (bebidas):', produtosFiltrados.length);
      console.log('📋 Exemplos:', produtosFiltrados.slice(0, 3).map(p => ({
        nome: p.nome,
        tipo: p.tipo_produto,
        preco_unitario: p.preco_unitario,
        preco_base: p.preco_base
      })));
      
      setProdutos(produtosFiltrados);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar produtos disponíveis',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingProdutos(false);
    }
  };

  const abrirModalAdicionarItem = async () => {
    if (!mesaSelecionada) {
      toast({
        title: 'Atenção',
        description: 'Selecione uma mesa primeiro',
        variant: 'destructive'
      });
      return;
    }

    // Verificar se a mesa está no status correto
    const statusPermitidos = ['retirado', 'pronto', 'preparando', 'pendente'];
    if (!statusPermitidos.includes(mesaSelecionada.status_pedido)) {
      toast({
        title: 'Atenção',
        description: 'Só é possível adicionar itens em mesas abertas',
        variant: 'destructive'
      });
      return;
    }

    setProdutoSelecionado(null);
    setQuantidadeItem(1);
    setShowAdicionarItemModal(true);
    
    // Carregar produtos se ainda não foram carregados
    if (produtos.length === 0) {
      await loadProdutos();
    }
  };

  const adicionarItemNaMesa = async () => {
    if (!produtoSelecionado || !mesaSelecionada) return;

    try {
      setIsLoading(true);
      
      const response = await mesaService.adicionarItemMesa(
        mesaSelecionada.numero_mesa,
        produtoSelecionado.id,
        quantidadeItem
      );

      toast({
        title: 'Item Adicionado!',
        description: response.message || `Item adicionado à mesa ${mesaSelecionada.numero_mesa}`,
        duration: 3000
      });

      // Fechar modal e recarregar dados da mesa
      setShowAdicionarItemModal(false);
      setProdutoSelecionado(null);
      setQuantidadeItem(1);
      
      // Recarregar dados da mesa
      await buscarMesa(mesaSelecionada.numero_mesa);
      
    } catch (error) {
      toast({
        title: 'Erro ao Adicionar Item',
        description: error.response?.data?.error || 'Erro ao adicionar item à mesa',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const imprimirCupomMesa = async (mesa) => {
    if (!mesa) return;
    
    try {
      // Usar iframe invisível para impressão sem abrir janela
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      
      const cupomContent = formatTableClosingTicketForPrint(mesa, pixConfig);
      
      iframe.contentDocument.write('<html><head><title>Cupom Mesa ' + mesa.numero_mesa + '</title>');
      iframe.contentDocument.write('<style>body { font-family: monospace; font-size: 10pt; margin: 5px; } pre { white-space: pre-wrap; word-wrap: break-word; } </style>');
      iframe.contentDocument.write('</head><body>');
      iframe.contentDocument.write('<pre>' + cupomContent + '</pre>');
      iframe.contentDocument.write('</body></html>');
      iframe.contentDocument.close();
      
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      
      // Remover iframe após impressão
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao imprimir cupom:', error);
      // Fallback para janela de impressão
      imprimirCupom(mesa);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UtensilsCrossed className="h-8 w-8 text-primary" />
          Fechamento de Mesas
        </h1>
        <Button onClick={loadMesasAbertas} variant="outline" size="sm" disabled={isLoadingMesas}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingMesas ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Buscar Mesa Específica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Mesa para Fechamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="numeroMesa">Número da Mesa</Label>
                <Input
                  id="numeroMesa"
                  type="number"
                  placeholder="Digite o número da mesa"
                  value={numeroMesaBusca}
                  onChange={(e) => setNumeroMesaBusca(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && buscarMesa(numeroMesaBusca)}
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={() => buscarMesa(numeroMesaBusca)}
                  disabled={isLoading || !numeroMesaBusca}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Buscar
                </Button>
              </div>
            </div>

            {mesaSelecionada && (
              <div className="mt-6 space-y-4">
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Mesa</p>
                    <p className="text-lg font-semibold">#{mesaSelecionada.numero_mesa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(parseFloat(mesaSelecionada.total || 0))}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <p className="text-sm">
                      {mesaSelecionada.cliente?.nome || 'Cliente não identificado'}
                    </p>
                    {mesaSelecionada.cliente?.telefone && (
                      <p className="text-xs text-muted-foreground">
                        {mesaSelecionada.cliente.telefone}
                      </p>
                    )}
                  </div>
                </div>

                {mesaSelecionada.itens && mesaSelecionada.itens.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Itens Consumidos:</p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {mesaSelecionada.itens.map((item, index) => (
                        <div key={index} className="flex justify-between text-xs">
                          <span>{item.quantidade}x {item.sabor_registrado || item.produto_nome}</span>
                          <span>{formatCurrency(item.quantidade * item.valor_unitario)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="observacoes">Observações do Fechamento</Label>
                  <Textarea
                    id="observacoes"
                    placeholder="Observações sobre o fechamento (opcional)"
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => imprimirCupom(mesaSelecionada)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Imprimir Cupom
                  </Button>
                  <Button 
                    onClick={() => imprimirQrCodePix(mesaSelecionada)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    QR Code PIX
                  </Button>
                </div>

                {['retirado', 'pronto', 'preparando', 'pendente'].includes(mesaSelecionada.status_pedido) && (
                  <Button 
                    onClick={abrirModalAdicionarItem}
                    variant="outline"
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                )}

                <Button 
                  onClick={() => abrirModalFecharConta(mesaSelecionada)}
                  className="w-full"
                  disabled={isLoading}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {isLoading ? 'Fechando...' : 'Fechar Conta'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Mesas Abertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Mesas Abertas ({mesasAbertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingMesas ? (
              <div className="text-center py-4 text-muted-foreground">
                Carregando mesas...
              </div>
            ) : mesasAbertas.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Nenhuma mesa aberta no momento
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {mesasAbertas.map((mesa) => (
                  <div key={mesa.numero_mesa} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Mesa #{mesa.numero_mesa}</span>
                        <Badge variant={mesa.status_pedido === 'entregue' ? 'default' : 'secondary'}>
                          {mesa.status_pedido}
                        </Badge>
                      </div>
                      <span className="text-lg font-semibold text-green-600">
                        {formatCurrency(parseFloat(mesa.valor_total || mesa.total || 0))}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Aberta: {formatDateTime(mesa.abertura)}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {mesa.total_pedidos} pedido(s)
                      </div>
                    </div>

                    <div className="flex gap-1 mt-2">
                      <Button 
                        onClick={() => {
                          setNumeroMesaBusca(mesa.numero_mesa.toString());
                          buscarMesa(mesa.numero_mesa);
                        }}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Status PIX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Status do PIX
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {pixConfig?.pix_chave ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">PIX configurado: {pixConfig.pix_chave}</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">PIX não configurado - Configure nas configurações do sistema</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal para Fechar Conta */}
      <Dialog open={showFecharContaModal} onOpenChange={setShowFecharContaModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Fechar Conta - Mesa {mesaParaFechar?.numero_mesa}</DialogTitle>
            <DialogDescription>
              Selecione a forma de pagamento para fechar a conta desta mesa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Total da Mesa</Label>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(parseFloat(mesaParaFechar?.total || mesaParaFechar?.valor_total || 0))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <RadioGroup 
                value={formaPagamentoSelecionada} 
                onValueChange={setFormaPagamentoSelecionada}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="dinheiro" id="dinheiro" />
                  <Label htmlFor="dinheiro">Dinheiro</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cartao" id="cartao" />
                  <Label htmlFor="cartao">Cartão</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pix" id="pix" />
                  <Label htmlFor="pix">PIX</Label>
                </div>
              </RadioGroup>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowFecharContaModal(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={fecharConta}
              disabled={isLoading}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isLoading ? 'Fechando...' : 'Confirmar e Fechar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para Adicionar Item */}
      <Dialog open={showAdicionarItemModal} onOpenChange={setShowAdicionarItemModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Item - Mesa {mesaSelecionada?.numero_mesa}</DialogTitle>
            <DialogDescription>
              Selecione um produto para adicionar à mesa.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Selecione o Produto</Label>
              {isLoadingProdutos ? (
                <div className="text-center py-4 text-muted-foreground">
                  Carregando produtos...
                </div>
              ) : produtos.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum produto disponível
                </div>
              ) : (
                <select
                  className="w-full p-2 border rounded-md bg-white text-black"
                  style={{ backgroundColor: 'white', color: 'black' }}
                  value={produtoSelecionado?.id || ''}
                  onChange={(e) => {
                    const produto = produtos.find(p => p.id === e.target.value);
                    setProdutoSelecionado(produto);
                  }}
                >
                  <option value="">Selecione um produto</option>
                  {produtos.map(produto => {
                    const preco = produto.preco_unitario || produto.preco_base || 0;
                    return (
                      <option 
                        key={produto.id} 
                        value={produto.id}
                        style={{ color: 'black', backgroundColor: 'white' }}
                      >
                        {produto.nome} - {formatCurrency(preco)}
                        {preco === 0 && ' (Sem preço)'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantidade">Quantidade</Label>
              <Input
                id="quantidade"
                type="number"
                min="1"
                value={quantidadeItem}
                onChange={(e) => setQuantidadeItem(parseInt(e.target.value) || 1)}
              />
            </div>

            {produtoSelecionado && (
              <div className="space-y-2 p-3 bg-gray-50 rounded-md">
                <div className="flex justify-between text-sm">
                  <span>Produto:</span>
                  <span className="font-medium">{produtoSelecionado.nome}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Valor unitário:</span>
                  <span>{formatCurrency(produtoSelecionado.preco_unitario || produtoSelecionado.preco_base || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quantidade:</span>
                  <span>{quantidadeItem}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span className="text-green-600">
                    {formatCurrency((produtoSelecionado.preco_unitario || produtoSelecionado.preco_base || 0) * quantidadeItem)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowAdicionarItemModal(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button 
              onClick={adicionarItemNaMesa}
              disabled={isLoading || !produtoSelecionado || quantidadeItem < 1}
            >
              <Plus className="h-4 w-4 mr-2" />
              {isLoading ? 'Adicionando...' : 'Adicionar Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MesasPage; 