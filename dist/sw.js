// Service Worker para PWA - Sistema Pizzaria
const CACHE_NAME = 'pit-pizzaria-v1';
const STATIC_CACHE = 'pit-static-v1';
const API_CACHE = 'pit-api-v1';

// Arquivos estáticos para cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// URLs da API para cache
const API_ENDPOINTS = [
  '/api/auth/me',
  '/api/products',
  '/api/dashboard',
  '/api/orders'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('📦 Service Worker: Instalando...');
  
  event.waitUntil(
    Promise.all([
      // Cache de arquivos estáticos
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('💾 Cacheando arquivos estáticos');
        return cache.addAll(STATIC_FILES);
      }),
      
      // Cache de API (vazio inicialmente)
      caches.open(API_CACHE).then((cache) => {
        console.log('🔗 Cache de API criado');
        return cache;
      })
    ])
  );
  
  // Força ativação imediata
  self.skipWaiting();
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Ativado');
  
  event.waitUntil(
    // Limpa caches antigos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Toma controle de todas as abas
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia para arquivos estáticos: Cache First
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        
        return fetch(request).then((response) => {
          // Só cacheia respostas válidas
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      }).catch(() => {
        // Fallback para página offline
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
      })
    );
  }
  
  // Estratégia para API: Network First com Cache Fallback
  else if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).then((response) => {
        // Se resposta OK, cacheia apenas GETs
        if (response.status === 200 && request.method === 'GET') {
          const responseClone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Se offline, tenta cache
        if (request.method === 'GET') {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              console.log('📱 Servindo do cache offline:', request.url);
              return cachedResponse;
            }
            
            // Resposta de erro personalizada
            return new Response(
              JSON.stringify({
                error: 'Offline',
                message: 'Conecte-se à internet para esta funcionalidade'
              }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        }
      })
    );
  }
});

// Escutar mensagens do app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});

// Notificações push (futuro)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'PIT Pizzaria', {
        body: data.body || 'Nova notificação',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'pit-notification',
        data: data
      })
    );
  }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    self.clients.openWindow('/')
  );
});