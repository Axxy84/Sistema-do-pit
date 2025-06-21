# 🍕 Sistema PIT - Instalação Simplificada

## 🚀 Instalação em 1 Clique (RECOMENDADA)

### **Para qualquer computador Windows:**

1. **Baixe** a pasta `Sistema-do-pit` completa
2. **Entre** na pasta `instalacao-windows10`
3. **Clique com botão direito** em `instalar-universal.bat`
4. **Selecione** "Executar como Administrador"
5. **Aguarde** a instalação automática (5-15 minutos)
6. **Pronto!** Sistema funcionando

---

## 🎯 O que o Instalador Faz Automaticamente:

✅ **Detecta e instala Node.js** (se necessário)  
✅ **Escolhe banco de dados**: PostgreSQL ou SQLite  
✅ **Instala todas as dependências**  
✅ **Configura portas automaticamente**  
✅ **Cria scripts de controle**  
✅ **Cria atalhos na área de trabalho**  
✅ **Testa conexões**  
✅ **Sistema pronto para usar**  

---

## 🖥️ Funciona em Qualquer PC:

- **Windows 10/11** ✅
- **Celeron, i3, i5, i7** ✅  
- **4GB RAM ou mais** ✅
- **Com ou sem PostgreSQL** ✅
- **Qualquer rede** ✅
- **Funciona offline** ✅

---

## 🔧 Controles do Sistema:

Após instalação, você terá:

- **🍕 Iniciar Sistema.bat** - Liga o sistema
- **🛑 Parar Sistema.bat** - Desliga o sistema  
- **🌐 Acessar Sistema.bat** - Abre no navegador
- **📊 Status Sistema.bat** - Verifica se está rodando

---

## 🌐 Acesso ao Sistema:

**URL**: http://localhost:5173  
**Usuário**: admin@pizzaria.com  
**Senha**: admin123

---

## 🛠️ Se Algo Der Errado:

### **1. Execute o Diagnóstico:**
```
diagnostico-instalacao.bat
```

### **2. Problemas Comuns:**

**❌ "Node.js não encontrado"**  
→ Instalador baixa automaticamente  
→ Ou baixe em: https://nodejs.org  

**❌ "Porta em uso"**  
→ Execute: `🛑 Parar Sistema.bat`  
→ Aguarde 30 segundos  
→ Execute: `🍕 Iniciar Sistema.bat`  

**❌ "Erro de banco de dados"**  
→ Sistema usa SQLite automaticamente  
→ Não precisa instalar PostgreSQL  

**❌ "Permissão negada"**  
→ Execute sempre como Administrador  

---

## 💾 Banco de Dados:

### **Automático:**
- Sistema **detecta** se tem PostgreSQL
- Se **não tem**: usa SQLite (mais simples)
- Se **tem**: permite escolher qual usar

### **SQLite (Padrão):**
- ✅ Não precisa instalar nada
- ✅ Arquivo único: `backend/data/pizzaria.db`
- ✅ Backup simples: copiar arquivo
- ✅ Perfeito para pequenas pizzarias

### **PostgreSQL (Opcional):**
- ✅ Melhor performance
- ✅ Mais recursos avançados
- ✅ Configuração automática pelo instalador

---

## 📱 Instalação como App (PWA):

1. Sistema abre no navegador
2. Aparece: "📱 Instalar PIT Pizzaria"
3. Clique "Instalar"
4. Vira app do Windows
5. Ícone no Menu Iniciar

---

## 🔄 Sistema 100% Local:

### **Vantagens:**
- ✅ **Funciona offline** (sem internet)
- ✅ **Qualquer rede WiFi** 
- ✅ **Dados seguros** (ficam no seu PC)
- ✅ **Resposta instantânea**
- ✅ **Sem mensalidade de servidor**

### **Onde usar:**
- Casa ✅
- Trabalho ✅  
- Viagens ✅
- Qualquer lugar ✅

---

## 🆘 Suporte:

### **Auto-diagnóstico:**
1. Execute `diagnostico-instalacao.bat`
2. Verifique `📊 Status Sistema.bat`
3. Veja logs em `backend/server.log`

### **Informações para suporte:**
- Versão do Windows
- Mensagem de erro completa  
- Resultado do diagnóstico
- Screenshot do problema

---

## ✅ Checklist Pós-Instalação:

- [ ] Sistema inicia com `🍕 Iniciar Sistema.bat`
- [ ] Login funciona (admin@pizzaria.com)
- [ ] PWA instalada como app
- [ ] Atalho na área de trabalho criado
- [ ] Teste: criar um pedido
- [ ] Scripts de controle funcionando

---

## 🎉 Pronto!

**Sistema funcionando 100% local em qualquer rede!**

**Sem configuração de IP, sem dor de cabeça!**

---

*Desenvolvido para facilitar a vida das pizzarias 🍕*