// Utilitário para gerenciar cache e dados temporários do frontend

export const cacheManager = {
  // Limpar completamente todo cache/storage
  clearAllCache() {
    try {
      console.log('🧹 [CacheManager] Limpando TODOS os dados em cache...');
      
      // Limpar localStorage
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        localStorage.removeItem(key);
        console.log(`   🗑️ localStorage.${key} removido`);
      });
      
      // Limpar sessionStorage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        sessionStorage.removeItem(key);
        console.log(`   🗑️ sessionStorage.${key} removido`);
      });
      
      // Tentar limpar cache do browser (se disponível)
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
            console.log(`   🗑️ Cache ${cacheName} removido`);
          });
        });
      }
      
      console.log('✅ [CacheManager] Cache limpo completamente');
      
    } catch (error) {
      console.error('❌ [CacheManager] Erro ao limpar cache:', error);
    }
  },

  // Verificar se há dados com IDs numéricos (mock) no cache - VERSÃO AGRESSIVA
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
            
            // Verificar arrays com IDs numéricos
            if (data && Array.isArray(data)) {
              const hasNumericIds = data.some(item => 
                item.id && typeof item.id === 'number'
              );
              if (hasNumericIds) {
                mockDataFound.push(`localStorage.${key} (${data.length} items)`);
              }
            }
            
            // Verificar objetos individuais com ID numérico
            if (data && typeof data === 'object' && !Array.isArray(data)) {
              if (data.id && typeof data.id === 'number') {
                mockDataFound.push(`localStorage.${key} (objeto único)`);
              }
            }
            
            // Verificar strings que parecem IDs numéricos
            if (typeof data === 'string' && /^\d+$/.test(data) && data.length < 5) {
              mockDataFound.push(`localStorage.${key} (ID numérico: ${data})`);
            }
            
          } catch (e) {
            // Ignorar dados que não são JSON válido
          }
        }
      }
      
      // Verificar sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          try {
            const value = sessionStorage.getItem(key);
            const data = JSON.parse(value);
            
            if (data && Array.isArray(data)) {
              const hasNumericIds = data.some(item => 
                item.id && typeof item.id === 'number'
              );
              if (hasNumericIds) {
                mockDataFound.push(`sessionStorage.${key} (${data.length} items)`);
              }
            }
            
            if (data && typeof data === 'object' && !Array.isArray(data)) {
              if (data.id && typeof data.id === 'number') {
                mockDataFound.push(`sessionStorage.${key} (objeto único)`);
              }
            }
            
            if (typeof data === 'string' && /^\d+$/.test(data) && data.length < 5) {
              mockDataFound.push(`sessionStorage.${key} (ID numérico: ${data})`);
            }
            
          } catch (e) {
            // Ignorar dados que não são JSON válido
          }
        }
      }
      
      if (mockDataFound.length > 0) {
        console.warn('🚨 [CacheManager] DADOS MOCK DETECTADOS:', mockDataFound);
        return mockDataFound;
      }
      
      console.log('✅ [CacheManager] Nenhum dado mock encontrado no cache');
      return [];
    } catch (error) {
      console.error('❌ [CacheManager] Erro ao verificar dados mock:', error);
      return [];
    }
  },

  // Forçar limpeza automática e recarregar página
  forceCleanAndReload() {
    console.log('🚨 [CacheManager] FORÇANDO LIMPEZA E RECARREGAMENTO...');
    
    // Limpar tudo
    this.clearAllCache();
    
    // Aguardar um pouco e recarregar
    setTimeout(() => {
      console.log('🔄 [CacheManager] Recarregando página...');
      window.location.reload(true);
    }, 500);
  },

  // Verificação inicial automática
  autoCheck() {
    console.log('🔍 [CacheManager] Verificação automática iniciada...');
    
    const mockData = this.checkForMockData();
    
    if (mockData.length > 0) {
      console.error('🚨 DADOS MOCK DETECTADOS! Limpeza automática necessária.');
      console.log('📋 Dados encontrados:', mockData);
      
      // Avisar ao usuário e limpar automaticamente
      if (typeof window !== 'undefined') {
        const shouldClean = confirm(
          `⚠️ ATENÇÃO: Dados obsoletos detectados no cache!\n\n` +
          `Foram encontrados ${mockData.length} item(s) com dados antigos que podem causar erros.\n\n` +
          `Deseja limpar automaticamente? (Recomendado)`
        );
        
        if (shouldClean) {
          this.forceCleanAndReload();
        } else {
          console.warn('⚠️ Usuário optou por não limpar. Erros podem ocorrer.');
        }
      }
      
      return false; // Indica que há problemas
    }
    
    console.log('✅ [CacheManager] Verificação passou - cache limpo');
    return true; // Cache está limpo
  }
};

// Executar verificação automática quando o módulo for carregado
if (typeof window !== 'undefined') {
  // Aguardar o DOM carregar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      cacheManager.autoCheck();
    });
  } else {
    cacheManager.autoCheck();
  }
} 