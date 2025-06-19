# 🍕 Sistema Pizzaria - Instalação para Cliente

## 🎯 **Sistema 100% LOCAL - Funciona em qualquer rede!**

Este sistema foi desenvolvido para rodar completamente no computador do cliente, sem depender de configurações de rede.

---

## 📋 **Requisitos Mínimos**

- **Windows 10/11**
- **4GB RAM** (Celeron funciona perfeitamente)
- **5GB espaço livre** no HD
- **Conexão com internet** (apenas para instalação inicial)

---

## 🚀 **Instalação Automática**

### **1. Execute como Administrador:**
- Clique com botão direito em `instalar-local-automatico.bat`
- Selecione **"Executar como Administrador"**

### **2. O instalador fará automaticamente:**
- ✅ Baixar e instalar Node.js (se necessário)
- ✅ Configurar banco de dados (PostgreSQL ou SQLite)
- ✅ Instalar todas as dependências
- ✅ Configurar sistema para localhost
- ✅ Criar atalhos na área de trabalho
- ✅ Configurar PWA para instalação

### **3. Tempo de instalação:**
- **Primeira vez:** 10-20 minutos
- **Computador com Node.js:** 2-5 minutos

---

## 🎮 **Como Usar Após Instalação**

### **Iniciar Sistema:**
```
Duplo clique: "🍕 Iniciar Sistema.bat"
```
- Sistema abre automaticamente no navegador
- URL: `http://localhost:5173`

### **Credenciais de Acesso:**
```
📧 Email: admin@pizzaria.com
🔑 Senha: admin123
```

### **Instalar como App (PWA):**
1. Sistema abre no navegador
2. Aparece banner: "📱 Instale o PIT Pizzaria como app!"
3. Clique **"Instalar"**
4. Sistema vira um programa do Windows
5. Ícone aparece no Menu Iniciar

---

## 📱 **Vantagens do Sistema LOCAL**

### **✅ Funciona em qualquer lugar:**
- Casa, trabalho, viagem
- Qualquer rede WiFi
- Sem internet (após instalado)
- Sem configuração de IP

### **✅ Segurança:**
- Dados ficam no próprio computador
- Não trafegam pela internet
- Backup local
- Controle total

### **✅ Performance:**
- Resposta instantânea
- Sem latência de rede
- Funciona offline

---

## 🔧 **Controles do Sistema**

### **Arquivos de Controle:**
- `🍕 Iniciar Sistema.bat` - Liga o sistema
- `🛑 Parar Sistema.bat` - Desliga o sistema
- `🌐 Acessar Sistema.bat` - Abre no navegador
- `📊 Status Sistema.bat` - Verifica se está rodando

### **Atalhos Criados:**
- **Área de trabalho:** "🍕 Sistema Pizzaria"
- **Menu Iniciar:** Sistema Pizzaria
- **PWA:** "PIT Pizzaria" (após instalação)

---

## 🔄 **Atualizações do Sistema**

### **Como funcionam:**
1. Sistema verifica atualizações automaticamente
2. Quando conectado à internet, baixa nova versão
3. Service Worker aplica update automaticamente
4. **Zero configuração** necessária

### **Processo de update:**
```
Cliente: v1.0 → Sistema verifica → v2.0 disponível
↓
Download automático → Aplicação → "Nova versão disponível!"
↓
Cliente aceita → Sistema atualiza → Pronto!
```

---

## 📊 **Módulos do Sistema**

### **Sistema Completo Inclui:**
- 🏪 **Caixa Principal** - Vendas e pedidos
- 📱 **App Entregador** - Gestão de entregas  
- 👨‍🍳 **App Garçom** - Controle de mesas
- 💰 **Dashboard Dono** - Analytics e relatórios

### **URLs dos Módulos:**
```
Caixa:      http://localhost:5173/
Entregador: http://localhost:5173/entregador
Garçom:     http://localhost:5173/garcom
Dono:       http://localhost:5173/dono
```

### **Ativação por Licença:**
- Módulos são ativados conforme contrato
- Controle via painel administrativo
- Expandir funcionalidades sem reinstalar

---

## 🛠️ **Resolução de Problemas**

### **Sistema não inicia:**
1. Verificar se Node.js está instalado
2. Executar `📊 Status Sistema.bat`
3. Reiniciar computador
4. Executar instalador novamente

### **Erro de porta ocupada:**
1. Executar `🛑 Parar Sistema.bat`
2. Aguardar 30 segundos
3. Executar `🍕 Iniciar Sistema.bat`

### **Banco de dados com erro:**
1. Verificar se PostgreSQL está rodando
2. Ou usar opção SQLite (mais simples)
3. Reexecutar instalador

### **PWA não instala:**
- Usar Chrome ou Edge (Firefox não suporta)
- Limpar cache do navegador
- Verificar se sistema está rodando

---

## 💾 **Backup e Dados**

### **Localização dos Dados:**
```
PostgreSQL: C:\Program Files\PostgreSQL\15\data\
SQLite: [pasta-sistema]\backend\data\pizzaria.db
```

### **Backup Automático:**
- Sistema cria backup diário automático
- Arquivo: `backup_AAAA-MM-DD.sql`
- Localização: `[pasta-sistema]\backups\`

### **Restaurar Backup:**
```bash
# Via PostgreSQL
psql -U postgres -d pizzaria_db < backup_2025-01-15.sql

# Via SQLite
# Substituir arquivo pizzaria.db
```

---

## 📞 **Suporte Técnico**

### **Autodiagnóstico:**
1. `📊 Status Sistema.bat` - Verifica status
2. Verificar arquivos de log em `logs/`
3. Testar acesso: `http://localhost:5173`

### **Informações para Suporte:**
- Versão do Windows
- Mensagens de erro
- Logs do sistema
- Status das portas 3001 e 5173

### **Contato:**
- Email: [seu-email@suporte.com]
- WhatsApp: [seu-numero]
- Horário: Segunda a Sexta, 8h às 18h

---

## ✅ **Checklist Pós-Instalação**

- [ ] Sistema inicia corretamente
- [ ] Login funciona (admin@pizzaria.com)
- [ ] PWA instalada como app
- [ ] Atalhos na área de trabalho criados
- [ ] Teste de pedido realizado
- [ ] Backup automático configurado
- [ ] Cliente treinado no uso básico

---

**🎉 Sistema pronto para uso! Funciona 100% local, em qualquer rede!**