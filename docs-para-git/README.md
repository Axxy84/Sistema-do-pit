# 🍕 Sistema Pizzaria - Guia de Instalação Docker

Sistema completo de gestão para pizzarias com Docker.

## 🚀 Instalação Rápida

### Opção 1: Super Simples
```bash
# 1. Instalar Docker
# 2. Clonar/copiar o sistema
# 3. Rodar:
docker-compose up -d
```

**Pronto!** Acesse: http://localhost

### Opção 2: Windows com 4GB RAM
```cmd
deploy-lite.bat
```

### Opção 3: Instalação Completa
```bash
./deploy.sh dev
```

## 📚 Documentação Completa

- **[INSTALACAO_SIMPLES.txt](INSTALACAO_SIMPLES.txt)** - 3 passos rápidos
- **[INSTALACAO_DOCKER.md](INSTALACAO_DOCKER.md)** - Guia completo de instalação
- **[INSTALACAO_WINDOWS_LITE.md](INSTALACAO_WINDOWS_LITE.md)** - Para PCs com 4GB RAM
- **[INSTALACAO_MANUAL_WINDOWS.md](INSTALACAO_MANUAL_WINDOWS.md)** - Sem Docker
- **[INSTALAR_DO_HD.md](INSTALAR_DO_HD.md)** - Instalação via HD externo
- **[DEPLOY_DOCKER.md](DEPLOY_DOCKER.md)** - Documentação técnica

## 🔧 Scripts Úteis

- `subir-docker.bat` - Inicia o sistema (Windows)
- `deploy-lite.bat` - Instalação para PCs fracos
- `preparar-hd.bat` - Prepara arquivos para HD externo

## 📋 Requisitos Mínimos

- **Docker Desktop** instalado
- **4GB RAM** (versão lite) ou 8GB (completa)
- **Windows 10/11** ou Linux
- **10GB** espaço em disco

## 🎯 Credenciais Padrão

- **URL**: http://localhost
- **Email**: admin@pizzaria.com
- **Senha**: admin123

## ⚡ Comandos Essenciais

```bash
# Iniciar sistema
docker-compose up -d

# Parar sistema
docker-compose down

# Ver logs
docker-compose logs

# Reiniciar
docker-compose restart
```

---

**Desenvolvido com ❤️ para facilitar sua vida!**