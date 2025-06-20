@echo off
echo =========================================
echo   INSTALADOR SISTEMA PIT - ELECTRON
echo =========================================
echo.

:: Verificar se está sendo executado como administrador
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERRO] Este instalador precisa ser executado como Administrador!
    echo.
    echo Clique com o botao direito e selecione "Executar como administrador"
    pause
    exit /b 1
)

cd /d "%~dp0\.."
set SISTEMA_PATH=%cd%

echo [1/8] Verificando Node.js...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Node.js nao encontrado!
    echo Baixe em: https://nodejs.org
    pause
    exit /b 1
) else (
    echo [OK] Node.js instalado
)

echo.
echo [2/8] Instalando dependencias do Backend...
cd backend
call npm install

echo.
echo [3/8] Instalando dependencias do Frontend...
cd ..
call npm install

echo.
echo [4/8] Instalando Electron e ferramentas...
call npm install electron electron-builder --save-dev

echo.
echo [5/8] Criando estrutura do Electron...

:: Criar arquivo principal do Electron
echo const { app, BrowserWindow, Menu } = require('electron'); > electron-main.js
echo const path = require('path'); >> electron-main.js
echo const { spawn } = require('child_process'); >> electron-main.js
echo. >> electron-main.js
echo let mainWindow; >> electron-main.js
echo let backendProcess; >> electron-main.js
echo. >> electron-main.js
echo // Iniciar backend >> electron-main.js
echo function startBackend() { >> electron-main.js
echo   backendProcess = spawn('node', ['server.js'], { >> electron-main.js
echo     cwd: path.join(__dirname, 'backend'), >> electron-main.js
echo     shell: true >> electron-main.js
echo   }); >> electron-main.js
echo. >> electron-main.js
echo   backendProcess.stdout.on('data', (data) =^> { >> electron-main.js
echo     console.log(`Backend: ${data}`); >> electron-main.js
echo   }); >> electron-main.js
echo. >> electron-main.js
echo   backendProcess.stderr.on('data', (data) =^> { >> electron-main.js
echo     console.error(`Backend Error: ${data}`); >> electron-main.js
echo   }); >> electron-main.js
echo } >> electron-main.js
echo. >> electron-main.js
echo function createWindow() { >> electron-main.js
echo   mainWindow = new BrowserWindow({ >> electron-main.js
echo     width: 1400, >> electron-main.js
echo     height: 900, >> electron-main.js
echo     icon: path.join(__dirname, 'public', 'icon.ico'), >> electron-main.js
echo     webPreferences: { >> electron-main.js
echo       nodeIntegration: false, >> electron-main.js
echo       contextIsolation: true, >> electron-main.js
echo       webSecurity: true >> electron-main.js
echo     }, >> electron-main.js
echo     show: false >> electron-main.js
echo   }); >> electron-main.js
echo. >> electron-main.js
echo   // Remover menu >> electron-main.js
echo   Menu.setApplicationMenu(null); >> electron-main.js
echo. >> electron-main.js
echo   // Aguardar backend iniciar >> electron-main.js
echo   setTimeout(() =^> { >> electron-main.js
echo     mainWindow.loadURL('http://localhost:5173'); >> electron-main.js
echo     mainWindow.show(); >> electron-main.js
echo   }, 3000); >> electron-main.js
echo. >> electron-main.js
echo   mainWindow.on('closed', () =^> { >> electron-main.js
echo     mainWindow = null; >> electron-main.js
echo   }); >> electron-main.js
echo } >> electron-main.js
echo. >> electron-main.js
echo app.whenReady().then(() =^> { >> electron-main.js
echo   startBackend(); >> electron-main.js
echo   createWindow(); >> electron-main.js
echo }); >> electron-main.js
echo. >> electron-main.js
echo app.on('window-all-closed', () =^> { >> electron-main.js
echo   if (backendProcess) { >> electron-main.js
echo     backendProcess.kill(); >> electron-main.js
echo   } >> electron-main.js
echo   if (process.platform !== 'darwin') { >> electron-main.js
echo     app.quit(); >> electron-main.js
echo   } >> electron-main.js
echo }); >> electron-main.js

echo.
echo [6/8] Configurando package.json...
npm pkg set main="electron-main.js"
npm pkg set scripts.electron="concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\""
npm pkg set scripts.build-win="npm run build && electron-builder --win"
npm pkg set scripts.dist="electron-builder"

:: Instalar concurrently e wait-on
call npm install concurrently wait-on --save-dev

echo.
echo [7/8] Criando configuracao do Electron Builder...
echo { > electron-builder.json
echo   "appId": "com.pitstop.sistema", >> electron-builder.json
echo   "productName": "Sistema PIT", >> electron-builder.json
echo   "directories": { >> electron-builder.json
echo     "output": "dist-electron" >> electron-builder.json
echo   }, >> electron-builder.json
echo   "files": [ >> electron-builder.json
echo     "electron-main.js", >> electron-builder.json
echo     "dist/**/*", >> electron-builder.json
echo     "backend/**/*", >> electron-builder.json
echo     "public/icon.ico" >> electron-builder.json
echo   ], >> electron-builder.json
echo   "win": { >> electron-builder.json
echo     "target": "nsis", >> electron-builder.json
echo     "icon": "public/icon.ico" >> electron-builder.json
echo   }, >> electron-builder.json
echo   "nsis": { >> electron-builder.json
echo     "oneClick": false, >> electron-builder.json
echo     "allowToChangeInstallationDirectory": true, >> electron-builder.json
echo     "createDesktopShortcut": true, >> electron-builder.json
echo     "createStartMenuShortcut": true >> electron-builder.json
echo   } >> electron-builder.json
echo } >> electron-builder.json

echo.
echo [8/8] Criando scripts auxiliares...

:: Script para rodar em desenvolvimento
echo @echo off > sistema-pit-dev.bat
echo echo Iniciando Sistema PIT (Desenvolvimento)... >> sistema-pit-dev.bat
echo npm run electron >> sistema-pit-dev.bat

:: Script para criar executável
echo @echo off > criar-executavel.bat
echo echo Compilando Sistema PIT... >> criar-executavel.bat
echo call npm run build >> criar-executavel.bat
echo echo. >> criar-executavel.bat
echo echo Criando executavel... >> criar-executavel.bat
echo call npm run dist >> criar-executavel.bat
echo echo. >> criar-executavel.bat
echo echo Executavel criado em: dist-electron\ >> criar-executavel.bat
echo pause >> criar-executavel.bat

echo.
echo =========================================
echo   INSTALACAO ELECTRON CONCLUIDA!
echo =========================================
echo.
echo PROXIMOS PASSOS:
echo.
echo 1. Configure o banco de dados:
echo    Execute: configurar-banco-dados.bat
echo.
echo 2. Para desenvolvimento:
echo    Execute: sistema-pit-dev.bat
echo.
echo 3. Para criar EXE instalavel:
echo    Execute: criar-executavel.bat
echo.
echo O sistema abrira como aplicativo desktop!
echo.
pause