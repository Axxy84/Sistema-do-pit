# 📱 Guia de Instalação PWA - Sistema Pizzaria

## 🎯 O que foi implementado

✅ **PWA Completo**:
- Manifest.json configurado
- Service Worker para cache offline
- Ícones personalizados
- Instalação como app nativo
- Funciona em Windows, Android, iOS

## 🛠️ Configuração do Servidor

### 1. **Backend com rede local**
```bash
cd backend
npm install
npm start  # Porta 3001
```

### 2. **Frontend PWA**
```bash
npm install
npm run dev  # Porta 5173, acessível via rede
```

## 🔧 Criando os Ícones

1. Abra o arquivo `criar-icones-pwa.html` no navegador
2. Clique em "Download Ícones"
3. Mova os arquivos para `public/`:
   - `icon-192.png`
   - `icon-512.png`

## 🌐 Como Usar

### **No Servidor (uma máquina):**
```bash
# Verificar IP da máquina
ipconfig  # Windows
# ou
ifconfig  # Linux

# Exemplo: IP = 192.168.1.100
```

### **Nos Clientes (Celeron ou qualquer PC):**
1. Abrir Chrome/Edge
2. Digitar: `http://192.168.1.100:5173`
3. Sistema carrega normalmente
4. Aparece banner: "📱 Instale o PIT Pizzaria como app!"
5. Clicar "Instalar"

## 📲 Após Instalação

### **Como fica no Windows:**
- ✅ Ícone no Menu Iniciar
- ✅ Ícone na Área de Trabalho
- ✅ Abre em janela própria (parece exe)
- ✅ Funciona offline limitado
- ✅ Notificações push (futuro)

### **Como fica no Android:**
- ✅ App na tela inicial
- ✅ Splash screen vermelho
- ✅ Barra de status vermelha
- ✅ Funciona como app nativo

## 🔌 Recursos Offline

**Funciona offline:**
- ✅ Interface completa
- ✅ Dados já carregados
- ✅ Navegação entre páginas
- ✅ Formulários (salva quando volta online)

**Precisa online:**
- ❌ Login inicial
- ❌ Salvar pedidos novos
- ❌ Sincronização em tempo real

## 🚀 Comandos Importantes

### **Iniciar sistema (servidor):**
```bash
# Terminal 1 - Backend
cd backend && npm start

# Terminal 2 - Frontend PWA
npm run dev

# Acesso: http://IP-SERVIDOR:5173
```

### **Build de produção (mais rápido):**
```bash
npm run build
npm run preview  # Testa build
```

### **Verificar PWA:**
1. Abrir DevTools (F12)
2. Aba "Application"
3. Seção "Service Workers"
4. Verificar se está registrado

## 🔧 Configurações Avançadas

### **Cache personalizado:**
```javascript
// Em sw.js, linha 4
const CACHE_NAME = 'pit-pizzaria-v2';  // Alterar versão

// Limpar cache
navigator.serviceWorker.controller.postMessage({
  type: 'CLEAR_CACHE'
});
```

### **Notificações push:**
```javascript
// Pedir permissão
Notification.requestPermission().then(permission => {
  if (permission === 'granted') {
    console.log('Notificações habilitadas');
  }
});
```

## 🛡️ Segurança

### **Acesso local seguro:**
- Sistema acessível apenas na rede local
- Não exposto na internet
- JWT com 7 dias de validade
- HTTPS não necessário (rede local)

### **Para produção:**
- Usar HTTPS obrigatório
- Configurar CORS específico
- JWT com tempo menor
- Rate limiting ativo no backend

## 📊 Performance no Celeron 4GB

### **Servidor (uma máquina melhor):**
- Node.js: ~300MB RAM
- PostgreSQL: ~200MB RAM
- Total: ~500MB RAM

### **Cliente Celeron:**
- Chrome PWA: ~200MB RAM
- Cache local: ~50MB storage
- **Total: Apenas 200MB RAM**

## 🎯 Vantagens do PWA

1. **Zero instalação** nos clientes
2. **Parece app nativo** (ícone, janela própria)
3. **Atualizações automáticas**
4. **Funciona offline** (limitado)
5. **Multiplataforma** (Windows, Android, iOS)
6. **Leve** (200MB vs 2GB Docker)

## 🆘 Problemas Comuns

### **"Não consigo instalar"**
- Usar Chrome/Edge (Firefox não suporta)
- Verificar se HTTPS ou localhost
- Limpar cache do navegador

### **"Não aparece o banner"**
- Aguardar 10 segundos
- Verificar console (F12)
- Tentar Chrome modo anônimo

### **"App não abre"**
- Verificar se servidor está rodando
- Testar no navegador primeiro
- Verificar IP da rede

### **"Muito lento"**
- Fechar outras abas
- Usar modo anônimo
- Verificar cache do Service Worker

## 📱 Resultado Final

**Cliente vê:**
- App "PIT Pizzaria" instalado
- Ícone vermelho com pizza
- Abre em janela própria
- Interface igual ao sistema web
- Funciona como programa nativo

**Você gerencia:**
- Um servidor central
- Atualizações automáticas
- Backup centralizado
- Múltiplos clientes simultâneos

---

**🎉 PWA pronto para uso!**