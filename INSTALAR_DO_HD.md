# 📀 Instalação a partir do HD Externo

## ✅ O que você precisa levar no HD:

1. **A pasta completa do sistema** com todos os arquivos
2. **Instalador do Docker Desktop** (baixe antes):
   - Windows: https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
   - Salve no HD também

## 🚀 Chegando no local de instalação:

### Passo 1: Instalar Docker
```cmd
# Se não tiver internet, use o instalador do HD:
D:\Docker Desktop Installer.exe
```

### Passo 2: Copiar sistema para o PC
```cmd
# Copie a pasta toda do HD para C:\
# Exemplo:
xcopy D:\Sistema-do-pit C:\Sistema-do-pit /E /I
```

### Passo 3: Abrir terminal na pasta
```cmd
cd C:\Sistema-do-pit
```

### Passo 4: Subir os containers

**Opção A - PC com recursos normais:**
```bash
# Dar permissão
chmod +x deploy.sh

# Instalar
./deploy.sh dev
```

**Opção B - PC fraco (4GB RAM):**
```cmd
deploy-lite.bat
# Escolher opção 1
```

### Passo 5: Pronto!
- Sistema rodando em: http://localhost
- Login: admin@pizzaria.com / admin123

## 📦 Se não tiver internet no local:

Docker precisa baixar as imagens base na primeira vez. Para evitar isso:

### Antes de ir (no seu PC com internet):
```bash
# Baixar todas as imagens
docker pull postgres:15-alpine
docker pull node:18-alpine
docker pull nginx:alpine
docker pull redis:7-alpine

# Salvar em arquivos
docker save -o postgres.tar postgres:15-alpine
docker save -o node.tar node:18-alpine
docker save -o nginx.tar nginx:alpine
docker save -o redis.tar redis:7-alpine
```

### No PC de destino (sem internet):
```bash
# Carregar imagens
docker load -i postgres.tar
docker load -i node.tar
docker load -i nginx.tar
docker load -i redis.tar

# Agora pode rodar normal
./deploy.sh dev
```

## 🎯 Resumo - Levar no HD:

1. ✅ Pasta completa `Sistema-do-pit`
2. ✅ Instalador Docker Desktop
3. ✅ (Opcional) Imagens Docker em .tar

**É só isso! Chega lá, instala Docker, copia a pasta e roda!** 🚀