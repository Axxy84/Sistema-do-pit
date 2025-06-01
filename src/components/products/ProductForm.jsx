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
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [estoqueDisponivel, setEstoqueDisponivel] = useState('');
  const [ativo, setAtivo] = useState(true);

  const { toast } = useToast();

  const resetFormFields = () => {
    setNome('');
    setTipoProduto('pizza');
    setCategoria('');
    setTamanhosPrecos([{ tamanho: '', preco: '', id_tamanho: '' }]);
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
      setPrecoUnitario(initialProductData.preco_unitario ? initialProductData.preco_unitario.toString() : '');
      setEstoqueDisponivel(initialProductData.estoque_disponivel ? initialProductData.estoque_disponivel.toString() : '');
      setAtivo(initialProductData.ativo === undefined ? true : initialProductData.ativo);
    } else {
      resetFormFields();
    }
  }, [initialProductData, isOpen]);

  const handleTamanhoPrecoChange = (index, field, value) => {
    const newTamanhosPrecos = [...tamanhosPrecos];
    newTamanhosPrecos[index][field] = value;
    if (field === 'id_tamanho') {
        const selectedSize = pizzaSizes.find(s => s.id === value);
        newTamanhosPrecos[index]['tamanho'] = selectedSize ? selectedSize.name : '';
    }
    setTamanhosPrecos(newTamanhosPrecos);
  };

  const addTamanhoPreco = () => {
    setTamanhosPrecos([...tamanhosPrecos, { tamanho: '', preco: '', id_tamanho: '' }]);
  };

  const removeTamanhoPreco = (index) => {
    const newTamanhosPrecos = tamanhosPrecos.filter((_, i) => i !== index);
    setTamanhosPrecos(newTamanhosPrecos);
  };

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
      preco_unitario: tipoProduto !== 'pizza' ? parseFloat(precoUnitario) : null,
      estoque_disponivel: tipoProduto !== 'pizza' && estoqueDisponivel ? parseInt(estoqueDisponivel, 10) : null,
      ativo
    };

    onSubmit(produtoFinal);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(openState) => { onOpenChange(openState); if (!openState) resetFormFields(); }}>
      <DialogContent className="sm:max-w-2xl bg-card">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary">{initialProductData ? 'Editar Produto' : 'Adicionar Novo Produto'}</DialogTitle>
          <DialogDescription>
            Preencha os detalhes do produto. Clique em salvar quando terminar.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-6 py-4 max-h-[80vh] overflow-y-auto pr-3">
          <div className="grid gap-2">
            <Label htmlFor="product-name" className="text-foreground/80">Nome do Produto</Label>
            <Input id="product-name" value={nome} onChange={(e) => setNome(e.target.value)} required className="bg-background/70"/>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="product-type" className="text-foreground/80">Tipo do Produto</Label>
            <Select value={tipoProduto} onValueChange={(value) => { setTipoProduto(value); setCategoria(''); }} required>
              <SelectTrigger id="product-type"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
              <SelectContent>
                {productTypes.map((pt) => (
                  <SelectItem key={pt.id} value={pt.id}>{pt.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {tipoProduto === 'pizza' && (
            <>
              <div className="grid gap-2">
                <Label className="text-foreground/80">Tamanhos e Preços</Label>
                {tamanhosPrecos.map((tp, index) => (
                  <div key={index} className="flex items-end gap-2 p-2 border rounded-md">
                    <div className="flex-1">
                      <Label htmlFor={`pizza-size-${index}`} className="text-xs">Tamanho</Label>
                      <Select value={tp.id_tamanho} onValueChange={(val) => handleTamanhoPrecoChange(index, 'id_tamanho', val)} required>
                        <SelectTrigger id={`pizza-size-${index}`}><SelectValue placeholder="Tamanho" /></SelectTrigger>
                        <SelectContent>
                          {pizzaSizes.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1">
                      <Label htmlFor={`pizza-price-${index}`} className="text-xs">Preço (R$)</Label>
                      <Input id={`pizza-price-${index}`} type="number" step="0.01" placeholder="Preço" value={tp.preco} onChange={(e) => handleTamanhoPrecoChange(index, 'preco', e.target.value)} required className="bg-background/70"/>
                    </div>
                    {tamanhosPrecos.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeTamanhoPreco(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addTamanhoPreco} className="mt-1">
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Tamanho/Preço
                </Button>
              </div>
            </>
          )}

          {tipoProduto !== 'pizza' && (
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