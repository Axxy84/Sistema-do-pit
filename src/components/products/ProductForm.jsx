import React, { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Trash2, PackagePlus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

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
  const [ingredientesDescricao, setIngredientesDescricao] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState('');
  const [estoqueDisponivel, setEstoqueDisponivel] = useState('');
  const [ativo, setAtivo] = useState(true);
  const [controlarEstoqueIngredientes, setControlarEstoqueIngredientes] = useState(false);
  const [listaIngredientes, setListaIngredientes] = useState([]);
  const [ingredientesAssociados, setIngredientesAssociados] = useState([{ ingrediente_id: '', quantidade_utilizada: '' }]);

  const { toast } = useToast();

  const fetchAllIngredients = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('ingredientes').select('id, nome, unidade_medida').order('nome');
      if (error) throw error;
      setListaIngredientes(data || []);
    } catch (error) {
      toast({ title: 'Erro ao buscar ingredientes', description: error.message, variant: 'destructive' });
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchAllIngredients();
    }
  }, [isOpen, fetchAllIngredients]);

  const resetFormFields = () => {
    setNome('');
    setTipoProduto('pizza');
    setCategoria('');
    setTamanhosPrecos([{ tamanho: '', preco: '', id_tamanho: '' }]);
    setIngredientesDescricao('');
    setPrecoUnitario('');
    setEstoqueDisponivel('');
    setAtivo(true);
    setControlarEstoqueIngredientes(false);
    setIngredientesAssociados([{ ingrediente_id: '', quantidade_utilizada: '' }]);
  };

  useEffect(() => {
    if (initialProductData) {
      setNome(initialProductData.nome || '');
      setTipoProduto(initialProductData.tipo_produto || 'pizza');
      setCategoria(initialProductData.categoria || '');
      setTamanhosPrecos(initialProductData.tamanhos_precos && initialProductData.tamanhos_precos.length > 0 ? initialProductData.tamanhos_precos : [{ tamanho: '', preco: '', id_tamanho: '' }]);
      setIngredientesDescricao(initialProductData.ingredientes || '');
      setPrecoUnitario(initialProductData.preco_unitario ? initialProductData.preco_unitario.toString() : '');
      setEstoqueDisponivel(initialProductData.estoque_disponivel ? initialProductData.estoque_disponivel.toString() : '');
      setAtivo(initialProductData.ativo === undefined ? true : initialProductData.ativo);
      
      const hasAssociatedIngredients = initialProductData.produtos_ingredientes && initialProductData.produtos_ingredientes.length > 0;
      setControlarEstoqueIngredientes(hasAssociatedIngredients);
      setIngredientesAssociados(hasAssociatedIngredients ? initialProductData.produtos_ingredientes : [{ ingrediente_id: '', quantidade_utilizada: '' }]);

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

  const handleIngredienteAssociadoChange = (index, field, value) => {
    const newIngredientesAssociados = [...ingredientesAssociados];
    newIngredientesAssociados[index][field] = value;
    setIngredientesAssociados(newIngredientesAssociados);
  };

  const addIngredienteAssociado = () => {
    setIngredientesAssociados([...ingredientesAssociados, { ingrediente_id: '', quantidade_utilizada: '' }]);
  };

  const removeIngredienteAssociado = (index) => {
    const newIngredientesAssociados = ingredientesAssociados.filter((_, i) => i !== index);
    setIngredientesAssociados(newIngredientesAssociados);
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
      if (!controlarEstoqueIngredientes && (!precoUnitario || parseFloat(precoUnitario) <= 0)) {
        toast({ title: 'Erro de Validação', description: 'Preço unitário é obrigatório e deve ser positivo para este tipo de produto.', variant: 'destructive' });
        return;
      }
      if (!categoria && (tipoProduto === 'bebida' || tipoProduto === 'sobremesa' || tipoProduto === 'acompanhamento')) {
        toast({ title: 'Erro de Validação', description: 'Categoria é obrigatória para bebidas, sobremesas e acompanhamentos.', variant: 'destructive' });
        return;
      }
    }

    if (controlarEstoqueIngredientes && ingredientesAssociados.some(ia => !ia.ingrediente_id || !ia.quantidade_utilizada || parseFloat(ia.quantidade_utilizada) <= 0)) {
      toast({ title: 'Erro de Validação', description: 'Se o controle de estoque por ingredientes estiver ativo, todos os ingredientes associados devem ser selecionados e ter uma quantidade utilizada válida e positiva.', variant: 'destructive' });
      return;
    }
    
    const produtoFinal = {
      nome,
      tipo_produto: tipoProduto,
      categoria,
      tamanhos_precos: tipoProduto === 'pizza' ? tamanhosPrecos.map(tp => ({...tp, preco: parseFloat(tp.preco)})) : null,
      ingredientes: tipoProduto === 'pizza' ? ingredientesDescricao : null,
      preco_unitario: tipoProduto !== 'pizza' && !controlarEstoqueIngredientes ? parseFloat(precoUnitario) : null,
      estoque_disponivel: tipoProduto !== 'pizza' && !controlarEstoqueIngredientes && estoqueDisponivel ? parseInt(estoqueDisponivel, 10) : null,
      ativo,
      // Campos para controle de estoque por ingredientes
      controlar_estoque_ingredientes: controlarEstoqueIngredientes,
      produtos_ingredientes: controlarEstoqueIngredientes ? ingredientesAssociados.map(ia => ({...ia, quantidade_utilizada: parseFloat(ia.quantidade_utilizada)})) : []
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
            <Select value={tipoProduto} onValueChange={(value) => { setTipoProduto(value); setCategoria(''); setControlarEstoqueIngredientes(false); }} required>
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
              <div className="grid gap-2">
                <Label htmlFor="product-ingredients-desc" className="text-foreground/80">Descrição dos Ingredientes (opcional)</Label>
                <Textarea id="product-ingredients-desc" placeholder="Ex: Queijo, tomate, orégano" value={ingredientesDescricao} onChange={(e) => setIngredientesDescricao(e.target.value)} className="bg-background/70"/>
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
              
              <div className="flex items-center space-x-2 mt-2 border-t pt-4">
                <Switch id="control-stock-ingredients" checked={controlarEstoqueIngredientes} onCheckedChange={setControlarEstoqueIngredientes} />
                <Label htmlFor="control-stock-ingredients" className="text-foreground/80">Controlar estoque por ingredientes (para itens compostos)?</Label>
              </div>

              {!controlarEstoqueIngredientes && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="product-unit-price" className="text-foreground/80">Preço Unitário (R$)</Label>
                    <Input id="product-unit-price" type="number" step="0.01" placeholder="Ex: 9.90" value={precoUnitario} onChange={(e) => setPrecoUnitario(e.target.value)} required={!controlarEstoqueIngredientes} className="bg-background/70"/>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="product-stock" className="text-foreground/80">Estoque Disponível (opcional)</Label>
                    <Input id="product-stock" type="number" placeholder="Ex: 50" value={estoqueDisponivel} onChange={(e) => setEstoqueDisponivel(e.target.value)} className="bg-background/70"/>
                  </div>
                </>
              )}
            </>
          )}
          
          {(tipoProduto === 'pizza' || controlarEstoqueIngredientes) && (
            <div className="border-t pt-4 mt-4 space-y-4">
              <Label className="text-lg font-semibold text-primary flex items-center">
                <PackagePlus className="mr-2 h-5 w-5"/> Associar Ingredientes (para baixa de estoque)
              </Label>
              {ingredientesAssociados.map((ia, index) => (
                <div key={index} className="flex items-end gap-2 p-3 border rounded-md bg-muted/30">
                  <div className="flex-1">
                    <Label htmlFor={`assoc-ingredient-${index}`} className="text-xs text-foreground/70">Ingrediente</Label>
                    <Select value={ia.ingrediente_id} onValueChange={(val) => handleIngredienteAssociadoChange(index, 'ingrediente_id', val)} required={tipoProduto === 'pizza' || controlarEstoqueIngredientes}>
                      <SelectTrigger id={`assoc-ingredient-${index}`}><SelectValue placeholder="Selecione o ingrediente" /></SelectTrigger>
                      <SelectContent>
                        {listaIngredientes.map((ing) => (
                          <SelectItem key={ing.id} value={ing.id}>{ing.nome} ({ing.unidade_medida})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-1/3">
                    <Label htmlFor={`assoc-qty-${index}`} className="text-xs text-foreground/70">Qtde. Utilizada</Label>
                    <Input id={`assoc-qty-${index}`} type="number" step="0.01" placeholder="Qtde." value={ia.quantidade_utilizada} onChange={(e) => handleIngredienteAssociadoChange(index, 'quantidade_utilizada', e.target.value)} required={tipoProduto === 'pizza' || controlarEstoqueIngredientes} className="bg-background/70"/>
                  </div>
                  {ingredientesAssociados.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeIngredienteAssociado(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addIngredienteAssociado} className="mt-1">
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Ingrediente à Receita
              </Button>
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-amber-700 dark:text-amber-400 text-xs flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0"/>
                <span>Para pizzas, os ingredientes aqui listados são para baixa de estoque. A descrição dos ingredientes para o cliente é no campo acima. Para outros produtos, se "Controlar estoque por ingredientes" estiver marcado, estes serão usados para a baixa.</span>
              </div>
            </div>
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