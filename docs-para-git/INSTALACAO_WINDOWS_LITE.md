# 💻 Instalação Windows 10 - Versão LITE (4GB RAM)

## ⚡ Otimizado para PCs com poucos recursos

Este guia é específico para Windows 10 com:
- 4GB RAM ou menos
- Processador Celeron ou similar
- Pouco espaço em disco

## 📋 Pré-requisitos

### 1. Instalar Docker Desktop

1. **Baixe o Docker Desktop**:
   - Acesse: https://www.docker.com/products/docker-desktop/
   - Clique em "Download for Windows"
   - Execute o instalador

2. **Durante a instalação**:
   - ✅ Marque "Use WSL 2 instead of Hyper-V"
   - ✅ Aceite reiniciar o computador

3. **Após reiniciar, configure o Docker para usar menos RAM**:
   - Abra Docker Desktop
   - Clique na engrenagem ⚙️ (Settings)
   - Vá em "Resources" → "Advanced"
   - Configure:
     - Memory: **2 GB** (metade da sua RAM)
     - CPUs: **2**
     - Disk image size: **10 GB**
   - Clique "Apply & restart"

### 2. Habilitar WSL 2 (se necessário)

Abra PowerShell como Administrador e execute:
```powershell
# Habilitar WSL
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# Habilitar Virtual Machine
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reiniciar
Restart-Computer

# Após reiniciar, definir WSL 2 como padrão
wsl --set-default-version 2
```

## 🚀 Instalação do Sistema

### 1. Baixar o sistema

Se ainda não tem o código:
- Baixe o ZIP do repositório
- Extraia para `C:\sistema-pizzaria`

### 2. Abrir terminal na pasta do sistema

- Navegue até `C:\sistema-pizzaria`
- Clique com botão direito
- Selecione "Abrir no Terminal" ou "Git Bash Here"

### 3. Executar instalação LITE

```cmd
deploy-lite.bat
```

Escolha a opção **1** para instalar.

## 📱 Como usar o sistema

### Iniciar sistema
```cmd
deploy-lite.bat
```
Escolha opção **2**

### Acessar
- Abra o navegador
- Digite: `http://localhost`
- Login: `admin@pizzaria.com`
- Senha: `admin123`

### Parar sistema (economizar recursos)
```cmd
deploy-lite.bat
```
Escolha opção **3**

## 🔧 Otimizações aplicadas

A versão LITE tem as seguintes otimizações:

1. **PostgreSQL**: Configurado para usar no máximo 512MB RAM
2. **Backend**: Limitado a 512MB RAM
3. **Frontend**: Servido diretamente pelo Node (sem Nginx)
4. **Sem Redis**: Cache em memória do Node.js
5. **Sem Adminer**: Economiza recursos

## ⚠️ Dicas importantes

### 1. Feche outros programas
Antes de iniciar o sistema, feche:
- Chrome/Firefox (consomem muita RAM)
- Outros programas pesados

### 2. Performance
- O sistema pode demorar alguns segundos para responder
- Primeira inicialização demora 10-20 minutos
- Após instalado, inicia em 1-2 minutos

### 3. Backup regular
```cmd
deploy-lite.bat
```
Escolha opção **5** para backup

### 4. Se travar
- Opção **3** para parar
- Opção **2** para iniciar novamente

## 🆘 Problemas comuns

### "Docker daemon is not running"
1. Abra Docker Desktop
2. Aguarde ele iniciar (ícone fica verde)
3. Tente novamente

### "Out of memory"
1. Feche todos os programas
2. No Docker Desktop, reduza Memory para 1.5GB
3. Reinicie o Docker

### Sistema muito lento
1. Use Chrome no modo anônimo (usa menos RAM)
2. Evite abrir muitas abas
3. Faça pausas entre operações

### "Port 80 already in use"
1. Abra o Gerenciador de Tarefas
2. Procure por "Skype" ou "IIS"
3. Feche esses programas

## 💡 Alternativa: Instalação sem Docker

Se mesmo a versão LITE estiver pesada, considere:
1. Instalar PostgreSQL direto no Windows
2. Rodar o backend com Node.js local
3. Servir o frontend com um servidor simples

Veja o guia `INSTALACAO_MANUAL_WINDOWS.md` para essa opção.

## 📊 Requisitos vs Realidade

| Componente | Ideal | Versão LITE | Seu PC |
|------------|-------|-------------|---------|
| RAM | 8GB | 2GB | 4GB ✓ |
| CPU | i5 | 2 cores | Celeron ✓ |
| Disco | SSD | 10GB | HDD ✓ |

A versão LITE foi testada em PCs similares ao seu!

---

**Dica final**: Se o Docker Desktop parecer pesado, você pode tentar o **Docker Toolbox** (versão mais leve) ou a instalação manual.