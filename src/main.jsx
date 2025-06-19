import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

console.log('✅ main.jsx carregou!');

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('📱 PWA Service Worker registrado:', registration.scope);
        
        // Verificar atualizações
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              if (confirm('Nova versão disponível! Recarregar agora?')) {
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            }
          });
        });
      })
      .catch((error) => {
        console.log('❌ Erro ao registrar Service Worker:', error);
      });
  });
}

// Detectar se PWA foi instalada
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('📲 PWA pode ser instalada');
  e.preventDefault();
  deferredPrompt = e;
  
  // Mostrar banner de instalação customizado
  showInstallBanner();
});

// Mostrar banner de instalação
function showInstallBanner() {
  const banner = document.createElement('div');
  banner.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #dc2626;
      color: white;
      padding: 12px;
      text-align: center;
      z-index: 9999;
      font-family: system-ui;
    ">
      📱 Instale o PIT Pizzaria como app!
      <button onclick="installPWA()" style="
        margin-left: 10px;
        background: white;
        color: #dc2626;
        border: none;
        padding: 4px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
      ">Instalar</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        margin-left: 5px;
        background: transparent;
        color: white;
        border: 1px solid white;
        padding: 4px 8px;
        border-radius: 4px;
        cursor: pointer;
      ">✕</button>
    </div>
  `;
  
  document.body.appendChild(banner);
  
  // Auto-remove após 10 segundos
  setTimeout(() => {
    if (banner.parentElement) {
      banner.remove();
    }
  }, 10000);
}

// Função global para instalar PWA
window.installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('📱 Resultado da instalação:', outcome);
    deferredPrompt = null;
    
    // Remove banner
    const banner = document.querySelector('[style*="position: fixed"]');
    if (banner) banner.remove();
  }
};

// Detect quando PWA foi instalada
window.addEventListener('appinstalled', () => {
  console.log('✅ PWA instalada com sucesso!');
  deferredPrompt = null;
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);