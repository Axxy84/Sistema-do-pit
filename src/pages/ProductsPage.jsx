import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { productService } from '@/services/productService';
import ProductForm from '@/components/products/ProductForm';
import ProductListTabs from '@/components/products/layout/ProductListTabs'; 
import ProductListHeader from '@/components/products/layout/ProductListHeader';
import { PIZZA_SIZES } from '@/lib/constants'; 

export const PRODUCT_TYPES = [
  { id: 'pizza', name: 'Pizza' },
  { id: 'bebida', name: 'Bebida' },
  { id: 'sobremesa', name: 'Sobremesa' },
  { id: 'acompanhamento', name: 'Acompanhamento' },
  { id: 'borda', name: 'Borda Recheada' },
  { id: 'outro', name: 'Outro' },
];

export const PRODUCT_CATEGORIES = {
  bebida: ['Refrigerante', 'Suco', 'Água', 'Cerveja', 'Vinho', 'Outra'],
  sobremesa: ['Doce', 'Torta', 'Sorvete', 'Fruta', 'Outra'],
  acompanhamento: ['Porção', 'Molho', 'Pão', 'Outro'],
  outro: ['Item Diverso']
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); 
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const { toast } = useToast();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await productService.getAllActiveProducts();
      setProducts(data || []);
    } catch (error) {
      toast({
        title: 'Erro ao buscar produtos',
        description: error.message || 'Não foi possível carregar os dados dos produtos.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const resetForm = useCallback(() => {
    setCurrentProduct(null);
  }, []);

  const handleFormOpenChange = useCallback((isOpen) => {
    setIsFormOpen(isOpen);
    if (!isOpen) {
      resetForm();
    }
  }, [resetForm]);

  const handleSaveProduct = async (productData) => {
    setIsLoading(true);
    try {
      const dataToSave = {
        nome: productData.nome,
        tipo_produto: productData.tipo_produto,
        categoria: productData.tipo_produto !== 'pizza' ? productData.categoria : null,
        tamanhos_precos: productData.tipo_produto === 'pizza' ? productData.tamanhos_precos : null,
        ingredientes: productData.tipo_produto === 'pizza' ? productData.ingredientes : null,
        preco_unitario: productData.tipo_produto !== 'pizza' ? parseFloat(productData.preco_unitario) : null,
        estoque_disponivel: productData.tipo_produto !== 'pizza' && productData.estoque_disponivel ? parseInt(productData.estoque_disponivel, 10) : null,
        ativo: productData.ativo,
      };

      if (currentProduct && currentProduct.id) {
        await productService.updateProduct(currentProduct.id, dataToSave);
      } else {
        await productService.createProduct(dataToSave);
      }

      toast({ title: 'Sucesso!', description: `Produto ${currentProduct ? 'atualizado' : 'adicionado'} com sucesso.` });
      fetchProducts();
      setIsFormOpen(false);
      resetForm();

    } catch (error) {
      toast({
        title: `Erro ao ${currentProduct ? 'atualizar' : 'adicionar'} produto`,
        description: error.message || 'Ocorreu um problema ao salvar o produto.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = useCallback((product) => {
    setCurrentProduct(product);
    setIsFormOpen(true);
  }, []);

  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      // TODO: Implementar verificação de produtos em uso via API
      // Por ora, tentamos deletar diretamente
      await productService.deleteProduct(id);
      toast({ title: 'Sucesso!', description: 'Produto removido com sucesso.' });
      fetchProducts();
    } catch (error) {
      if (error.message.includes('em uso') || error.message.includes('constraint')) {
        toast({
          title: 'Produto em Uso',
          description: 'Este produto não pode ser excluído pois está associado a pedidos existentes. Considere desativá-lo.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Erro ao remover produto',
          description: error.message || 'Ocorreu um problema ao remover o produto.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleToggleActive = async (product) => {
    setIsLoading(true);
    try {
      await productService.updateProduct(product.id, { ativo: !product.ativo });
      toast({ title: 'Sucesso!', description: `Produto ${!product.ativo ? 'ativado' : 'desativado'}.` });
      fetchProducts();
    } catch (error) {
      toast({ title: 'Erro ao alterar status', description: error.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const nameMatch = product.nome.toLowerCase().includes(searchTerm.toLowerCase());
    
    let typeMatch = false;
    switch (activeTab) {
      case 'all':
        typeMatch = true;
        break;
      case 'pizza':
        typeMatch = product.tipo_produto === 'pizza';
        break;
      case 'bebida':
        typeMatch = product.tipo_produto === 'bebida';
        break;
      case 'sobremesa':
        typeMatch = product.tipo_produto === 'sobremesa';
        break;
      case 'acompanhamento':
        typeMatch = product.tipo_produto === 'acompanhamento';
        break;
      case 'borda':
        typeMatch = product.tipo_produto === 'borda';
        break;
      case 'outro':
        typeMatch = product.tipo_produto === 'outro';
        break;
      default:
        typeMatch = true;
    }
    
    return nameMatch && typeMatch;
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <ProductListHeader />
          <Button 
            onClick={() => { setCurrentProduct(null); setIsFormOpen(true); }}
            className="bg-gradient-to-r from-primary to-red-400 hover:from-primary/90 hover:to-red-400/90 text-white shadow-md hover:shadow-lg transition-shadow"
            disabled={isLoading}
          >
            <PlusCircle className="mr-2 h-5 w-5" /> Adicionar Produto
          </Button>
        </div>
      </motion.div>

      <ProductForm
        isOpen={isFormOpen}
        onOpenChange={handleFormOpenChange}
        onSubmit={handleSaveProduct}
        initialProductData={currentProduct}
        isLoading={isLoading}
        productTypes={PRODUCT_TYPES}
        productCategories={PRODUCT_CATEGORIES}
        pizzaSizes={PIZZA_SIZES}
      />

      <ProductListTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        products={products}
        filteredProducts={filteredProducts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
        isLoading={isLoading}
        pizzaSizes={PIZZA_SIZES} 
      />
    </div>
  );
};

export default ProductsPage;