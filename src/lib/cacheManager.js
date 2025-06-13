// Utilitário para gerenciar cache e dados temporários do frontend

export const cacheManager = {
  // Limpar todos os dados mock e cache do localStorage
  clearAllCache() {
    try {
      // Limpar localStorage
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.includes('product') || 
          key.includes('mock') || 
          key.includes('temp') ||
          key.includes('cache')
        )) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🗑️ Removido do cache: ${key}`);
      });
      
      // Limpar sessionStorage também
      sessionStorage.clear();
      
      console.log('✅ Cache limpo com sucesso!');
      return true;
    } catch (error) {
      console.error('❌ Erro ao limpar cache:', error);
      return false;
    }
  },

  // Verificar se há dados com IDs numéricos (mock) no cache
  checkForMockData() {
    try {
      const mockDataFound = [];
      
      // Verificar localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            const data = JSON.parse(value);
            
            // Verificar se há produtos com ID numérico
            if (data && Array.isArray(data)) {
              const hasNumericIds = data.some(item => 
                item.id && typeof item.id === 'number'
              );
              if (hasNumericIds) {
                mockDataFound.push(`localStorage.${key}`);
              }
            }
          } catch (e) {
            // Ignorar dados que não são JSON
          }
        }
      }
      
      if (mockDataFound.length > 0) {
        console.warn('⚠️ Dados mock encontrados:', mockDataFound);
        return mockDataFound;
      }
      
      console.log('✅ Nenhum dado mock encontrado no cache');
      return [];
    } catch (error) {
      console.error('❌ Erro ao verificar dados mock:', error);
      return [];
    }
  },

  // Forçar reload da página para garantir dados limpos
  forceReload() {
    console.log('🔄 Forçando reload para garantir dados limpos...');
    window.location.reload(true);
  },

  // Verificar e limpar automaticamente
  autoCleanup() {
    console.log('🧹 Iniciando limpeza automática...');
    
    const mockData = this.checkForMockData();
    if (mockData.length > 0) {
      console.log('🚨 Dados mock detectados! Limpando...');
      this.clearAllCache();
      
      // Aguardar um pouco e recarregar
      setTimeout(() => {
        this.forceReload();
      }, 1000);
      
      return true; // Indica que limpeza foi necessária
    }
    
    return false; // Nenhuma limpeza necessária
  }
};

// Executar verificação automática quando o módulo for carregado
if (typeof window !== 'undefined') {
  // Aguardar o DOM carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cacheManager.autoCleanup();
    });
  } else {
    cacheManager.autoCleanup();
  }
} 