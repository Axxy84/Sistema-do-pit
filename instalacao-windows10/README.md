# Sistema PIT - Instalação Windows 10

## 📋 Conteúdo desta Pasta

Esta pasta contém todos os arquivos necessários para instalar o Sistema PIT no Windows 10.

### Arquivos de Instalação:
- **`instalar-sistema-completo.bat`** - Instalador automático principal
- **`iniciar-sistema.bat`** - Inicia o sistema após instalação
- **`parar-sistema.bat`** - Para todos os processos do sistema
- **`diagnostico-instalacao.bat`** - Verifica problemas na instalação
- **`reiniciar-sistema.bat`** - Reinicia o sistema
- **`start-backend.bat`** - Inicia apenas o servidor backend
- **`configurar-banco-dados.bat`** - Configura o PostgreSQL
- **`criar-banco-dados.sql`** - Script SQL com configurações brasileiras

### Documentação:
- **`INSTALACAO_MANUAL_WINDOWS.md`** - Guia detalhado de instalação manual
- **`INSTALACAO_WINDOWS_LITE.md`** - Guia para PCs com poucos recursos

## 🚀 Instalação Rápida

1. **Execute como Administrador:**
   - Clique com botão direito em `instalar-sistema-completo.bat`
   - Selecione "Executar como administrador"

2. **Siga as instruções na tela**
   - O instalador verificará e instalará os pré-requisitos
   - Configurará o banco de dados automaticamente
   - Criará um atalho na área de trabalho

3. **Após a instalação:**
   - Use o atalho "Sistema PIT" na área de trabalho
   - Ou execute `iniciar-sistema.bat`

## 📌 Pré-requisitos

O instalador verificará e tentará instalar automaticamente:
- Node.js 20+ 
- PostgreSQL 14+

Se o PostgreSQL não for encontrado, você precisará instalá-lo manualmente:
https://www.postgresql.org/download/windows/

## 🔑 Credenciais Padrão

```
Email: admin@pizzaria.com
Senha: admin123
```

## ⚙️ Solução de Problemas

Se encontrar problemas:
1. Execute `diagnostico-instalacao.bat` para verificar o sistema
2. Consulte `INSTALACAO_MANUAL_WINDOWS.md` para instalação passo a passo
3. Para PCs com poucos recursos, use `INSTALACAO_WINDOWS_LITE.md`

## 📱 Acessar de Outros Dispositivos

Após a instalação, o sistema pode ser acessado de tablets e celulares na mesma rede:
- Descubra o IP do PC: `ipconfig` no CMD
- Acesse: `http://[SEU-IP]:5173`

## 🛑 Parar o Sistema

Para parar completamente o sistema:
- Execute `parar-sistema.bat`
- Ou feche a janela do terminal

## 📂 Estrutura Instalada

```
C:\sistema-pizzaria\
├── backend/          # Servidor Node.js
├── dist/            # Frontend compilado
├── instalacao-windows10/  # Esta pasta
└── ...              # Outros arquivos do sistema
```

## 💡 Dicas

- Mantenha o PostgreSQL sempre em execução
- O sistema inicia automaticamente o navegador
- Todos os dados ficam salvos no PostgreSQL
- Faça backup regular do banco de dados