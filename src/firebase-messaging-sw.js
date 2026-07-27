importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
});

const messaging = firebase.messaging();

// Claim clients immediately when service worker activates
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating and claiming clients...');
  event.waitUntil(
    self.clients.claim().then(() => {
      console.log('[Service Worker] Clients claimed! Service worker now controls all pages.');
    })
  );
});

// Skip waiting to activate immediately
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  self.skipWaiting();
});

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationBody = payload.notification?.body || '';
  const chatId = payload.data?.chatId;
  const route = payload.data?.route || (chatId ? `/tabs/chat/${chatId}` : '/tabs/chat');
  
  const notificationOptions = {
    body: notificationBody,
    icon: '/assets/icon/icon.png',
    badge: '/assets/icon/badge.png',
    tag: chatId || 'chat-notification',
    data: {
      chatId: chatId,
      route: route,
      url: route
    },
    requireInteraction: false,
    vibrate: [200, 100, 200]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification);
  
  event.notification.close();
  
  const data = event.notification.data;
  const chatId = data?.chatId;
  const route = data?.route || data?.url;
  
  // Determine the URL to open
  let urlToOpen = '/';
  if (route) {
    urlToOpen = route;
  } else if (chatId) {
    urlToOpen = `/tabs/chat/${chatId}`;
  }
  
  console.log('Opening URL:', urlToOpen);
  
  // Open or focus the app window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            // Focus the existing window and navigate to the chat
            return client.focus().then(() => {
              // Send message to the client to navigate
              return client.postMessage({
                type: 'NAVIGATE_TO_CHAT',
                chatId: chatId,
                route: urlToOpen
              });
            });
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});