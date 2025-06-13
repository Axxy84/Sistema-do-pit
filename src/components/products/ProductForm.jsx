import React, { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import PizzaSizeSelector from './PizzaSizeSelector';
import ProductTypeSelector from './ProductTypeSelector';

const ProductForm = ({ 
  isOpen, 
  onOpenChange, 
  onSubmit, 
  initialProductData, 
  isLoading,
  productTypes,
  productCategories,
  pizzaSizes
}) => {
  const [nome, setNome] = useState('');
  const [tipoProduto, setTipoProduto] = useState('pizza');
  const [categoria, setCategoria] = useState('');
  const [tamanhosPrecos, setTamanhosPrecos] = useState([{ tamanho: '', preco: '', id_tamanho: '' }]);
  const [ingredientes, setIngredientes] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [estoqueDisponivel, setEstoqueDisponivel] = useState('');
  const [ativo, setAtivo] = useState(true);

  const { toast } = useToast();

  const resetFormFields = () => {
    setNome('');
    setTipoProduto('pizza');
    setCategoria('');
    setTamanhosPrecos([{ tamanho: '', preco: '', id_tamanho: '' }]);
    setIngredientes('');
    setPrecoUnitario('');
    setEstoqueDisponivel('');
    setAtivo(true);
  };

  useEffect(() => {
    if (initialProductData) {
      setNome(initialProductData.nome || '');
      setTipoProduto(initialProductData.tipo_produto || 'pizza');
      setCategoria(initialProductData.categoria || '');
      setTamanhosPrecos(initialProductData.tamanhos_precos && initialProductData.tamanhos_precos.length > 0 ? initialProductData.tamanhos_precos : [{ tamanho: '', preco: '', id_tamanho: '' }]);
      setIngredientes(initialProductData.ingredientes || '');
      setPrecoUnitario(initialProductData.preco_unitario ? initialProductData.preco_unitario.toString() : '');
      setEstoqueDisponivel(initialProductData.estoque_disponivel ? initialProductData.estoque_disponivel.toString() : '');
      setAtivo(initialProductData.ativo === undefined ? true : initialProductData.ativo);
    } else {
      resetFormFields();
    }
  }, [initialProductData, isOpen]);



  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome || !tipoProduto) {
      toast({ title: 'Erro de Validação', description: 'Nome e Tipo do Produto são obrigatórios.', variant: 'destructive' });
      return;
    }

    if (tipoProduto === 'pizza') {
      if (tamanhosPrecos.some(tp => !tp.id_tamanho || !tp.preco || parseFloat(tp.preco) <= 0)) {
        toast({ title: 'Erro de Validação', description: 'Para pizzas, todos os tamanhos devem ter um preço válido e positivo.', variant: 'destructive' });
        return;
      }
    } else if (tipoProduto === 'borda') {
      if (!precoUnitario || parseFloat(precoUnitario) <= 0) {
        toast({ title: 'Erro de Validação', description: 'Preço da borda é obrigatório e deve ser positivo.', variant: 'destructive' });
        return;
      }
    } else { // Outros produtos
      if (!precoUnitario || parseFloat(precoUnitario) <= 0) {
        toast({ title: 'Erro de Validação', description: 'Preço unitário é obrigatório e deve ser positivo para este tipo de produto.', variant: 'destructive' });
        return;
      }
      if (!categoria && (tipoProduto === 'bebida' || tipoProduto === 'sobremesa' || tipoProduto === 'acompanhamento')) {
        toast({ title: 'Erro de Validação', description: 'Categoria é obrigatória para bebidas, sobremesas e acompanhamentos.', variant: 'destructive' });
        return;
      }
    }
    
    const produtoFinal = {
      nome,
      tipo_produto: tipoProduto,
      categoria,
      tamanhos_precos: tipoProduto === 'pizza' ? tamanhosPrecos.map(tp => ({...tp, preco: parseFloat(tp.preco)})) : null,
      ingredientes: tipoProduto === 'pizza' ? ingredientes : null,
      preco_unitario: (tipoProduto !== 'pizza' && tipoProduto !== 'borda') ? parseFloat(precoUnitario) : (tipoProduto === 'borda' ? parseFloat(precoUnitario) : null),
      estoque_disponivel: (tipoProduto !== 'pizza' && tipoProduto !== 'borda') && estoqueDisponivel ? parseInt(estoqueDisponivel, 10) : null,
      ativo
    };

    onSubmit(produtoFinal);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { onOpenChange(openState); if (!openState) resetFormFields(); }}>
      <DialogContent className="sm:max-w-4xl max-h-[95vh] bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary flex items-center gap-2">
            {tipoProduto === 'pizza' && <span className="text-2xl">🍕</span>}
            {initialProductData ? 'Editar Produto' : 'Adicionar Novo Produto'}
          </DialogTitle>
          <DialogDescription>
            {tipoProduto === 'pizza' 
              ? 'Configure sua pizza com diferentes tamanhos e preços de forma intuitiva.'
              : 'Preencha os detalhes do produto. Clique em salvar quando terminar.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[75vh] overflow-y-auto pr-3">
          <div className="grid gap-2">
            <Label htmlFor="product-name" className="text-foreground/80">Nome do Produto</Label>
            <Input id="product-name" value={nome} onChange={(e) => setNome(e.target.value)} required className="bg-background/70"/>
          </div>

          <ProductTypeSelector
            selectedType={tipoProduto}
            onTypeChange={(value) => { setTipoProduto(value); setCategoria(''); }}
            productTypes={productTypes}
            disabled={isLoading}
          />

          {tipoProduto === 'pizza' && (
            <PizzaSizeSelector
              tamanhosPrecos={tamanhosPrecos}
              onChange={setTamanhosPrecos}
              pizzaSizes={pizzaSizes}
              pizzaIngredients={ingredientes}
              onIngredientsChange={setIngredientes}
              pizzaName={nome || 'Nova Pizza'}
            />
          )}

          {tipoProduto === 'borda' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="product-price" className="text-foreground/80">Preço da Borda (R$)</Label>
                <Input 
                  id="product-price"
                  type="number" 
                  step="0.01" 
                  placeholder="Ex: 5.00"
                  value={precoUnitario} 
                  onChange={(e) => setPrecoUnitario(e.target.value)} 
                  required 
                  className="bg-background/70"/>
              </div>
            </>
          )}

          {tipoProduto !== 'pizza' && tipoProduto !== 'borda' && (
            <>
              {(tipoProduto === 'bebida' || tipoProduto === 'sobremesa' || tipoProduto === 'acompanhamento') && productCategories[tipoProduto] && (
                <div className="grid gap-2">
                  <Label htmlFor="product-category" className="text-foreground/80">Categoria</Label>
                  <Select value={categoria} onValueChange={setCategoria} required>
                    <SelectTrigger id="product-category"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                    <SelectContent>
                      {productCategories[tipoProduto].map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="product-unit-price" className="text-foreground/80">Preço Unitário (R$)</Label>
                <Input id="product-unit-price" type="number" step="0.01" placeholder="Ex: 9.90" value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} required className="bg-background/70"/>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="product-stock" className="text-foreground/80">Estoque Disponível (opcional)</Label>
                <Input id="product-stock" type="number" placeholder="Ex: 50" value={estoqueDisponivel} onChange={(e) => setEstoqueDisponivel(e.target.value)} className="bg-background/70"/>
              </div>
            </>
          )}
          
          <div className="flex items-center space-x-2 mt-4 border-t pt-4">
            <Switch id="product-active" checked={ativo} onCheckedChange={setAtivo} />
            <Label htmlFor="product-active" className="text-foreground/80">Produto Ativo</Label>
          </div>

          <DialogFooter className="mt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Cancelar</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {initialProductData ? 'Salvar Alterações' : 'Adicionar Produto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductForm;