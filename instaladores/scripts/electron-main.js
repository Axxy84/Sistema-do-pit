const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

// Configurar diretórios
const isDev = process.env.NODE_ENV === 'development';
const appPath = isDev ? __dirname : path.dirname(process.execPath);
const backendPath = path.join(appPath, 'backend');

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(__dirname, 'public', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    show: false
  });

  // Menu personalizado
  const template = [
    {
      label: 'Sistema',
      submenu: [
        { label: 'Recarregar', role: 'reload' },
        { label: 'Tela Cheia', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: 'Sair', role: 'quit' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre',
          click: () => {
            shell.openExternal('https://github.com/Axxy84/Sistema-do-pit');
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  // Carregar a aplicação
  mainWindow.loadURL('http://localhost:5173');

  // Mostrar quando estiver pronto
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function startBackend() {
  return new Promise((resolve, reject) => {
    // Criar arquivo .env se não existir
    const envPath = path.join(backendPath, '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = `# Configuração LOCAL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pizzaria_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=PIT_SECRET_${Date.now()}
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://localhost:5173`;
      
      fs.writeFileSync(envPath, envContent);
    }

    // Iniciar o backend
    const backendExe = path.join(backendPath, 'node.exe');
    const serverJs = path.join(backendPath, 'server.js');
    
    if (fs.existsSync(backendExe)) {
      // Usar node empacotado
      backendProcess = spawn(backendExe, [serverJs], {
        cwd: backendPath,
        env: { ...process.env }
      });
    } else {
      // Usar node do sistema
      backendProcess = spawn('node', [serverJs], {
        cwd: backendPath,
        env: { ...process.env }
      });
    }

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
      if (data.toString().includes('Server running')) {
        resolve();
      }
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      resolve(); // Continuar mesmo se não receber confirmação
    }, 30000);
  });
}

function startFrontend() {
  return new Promise((resolve) => {
    // Frontend já compilado está em dist/
    const distPath = path.join(appPath, 'dist');
    
    if (fs.existsSync(distPath)) {
      // Servir arquivos estáticos
      const express = require(path.join(backendPath, 'node_modules', 'express'));
      const frontendApp = express();
      
      frontendApp.use(express.static(distPath));
      frontendApp.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
      
      frontendApp.listen(5173, () => {
        console.log('Frontend served at http://localhost:5173');
        resolve();
      });
    } else {
      console.error('Frontend dist not found!');
      resolve();
    }
  });
}

app.whenReady().then(async () => {
  try {
    console.log('Starting backend...');
    await startBackend();
    
    console.log('Starting frontend...');
    await startFrontend();
    
    console.log('Creating window...');
    createWindow();
  } catch (error) {
    console.error('Startup error:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});