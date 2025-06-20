@echo off
echo =========================================
echo   CRIANDO APP DESKTOP COM ELECTRON
echo =========================================
echo.

cd /d "%~dp0\.."

echo Instalando Electron...
npm install electron --save-dev
npm install electron-builder --save-dev

echo.
echo Criando arquivo principal do Electron...

:: Criar main.js para Electron
echo const { app, BrowserWindow } = require('electron') > electron-main.js
echo const path = require('path') >> electron-main.js
echo. >> electron-main.js
echo function createWindow () { >> electron-main.js
echo   const mainWindow = new BrowserWindow({ >> electron-main.js
echo     width: 1200, >> electron-main.js
echo     height: 800, >> electron-main.js
echo     icon: path.join(__dirname, 'public/icon.ico'), >> electron-main.js
echo     webPreferences: { >> electron-main.js
echo       nodeIntegration: false, >> electron-main.js
echo       contextIsolation: true >> electron-main.js
echo     } >> electron-main.js
echo   }) >> electron-main.js
echo. >> electron-main.js
echo   mainWindow.loadURL('http://localhost:5173') >> electron-main.js
echo   mainWindow.removeMenu() >> electron-main.js
echo } >> electron-main.js
echo. >> electron-main.js
echo app.whenReady().then(createWindow) >> electron-main.js
echo. >> electron-main.js
echo app.on('window-all-closed', () =^> { >> electron-main.js
echo   if (process.platform !== 'darwin') app.quit() >> electron-main.js
echo }) >> electron-main.js

echo.
echo Atualizando package.json...
npm pkg set main="electron-main.js"
npm pkg set scripts.electron="electron ."
npm pkg set scripts.build-exe="electron-builder --win"

echo.
echo =========================================
echo   APP ELECTRON CRIADO COM SUCESSO!
echo =========================================
echo.
echo Para executar como app desktop:
echo 1. Inicie o sistema normalmente
echo 2. Execute: npm run electron
echo.
echo Para criar EXE instalavel:
echo Execute: npm run build-exe
echo.
pause