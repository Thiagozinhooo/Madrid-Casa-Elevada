/* Madrid Casa Elevada — Service Worker do Firebase Cloud Messaging (V362).
 * Recebe o push quando o app está FECHADO / em segundo plano e mostra a
 * notificação do sistema. Só entra em ação quando o AppPush é ativado no
 * index.html (VAPID key preenchido) — enquanto isso, este arquivo fica
 * inerte (nunca é registrado).
 * NÃO precisa de build — o GitHub Pages serve este arquivo direto da raiz. */

importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAMoE5JkohMp632zSUSublIuSx_JL1rxv4',
  authDomain: 'madrid-casa-elevada.firebaseapp.com',
  projectId: 'madrid-casa-elevada',
  messagingSenderId: '1056274692863',
  appId: '1:1056274692863:web:ade2d7b08f8fee9d776aca'
});

const messaging = firebase.messaging();

// Push recebido com o app em segundo plano / fechado.
messaging.onBackgroundMessage(function (payload) {
  const n = payload.notification || {};
  const data = payload.data || {};
  self.registration.showNotification(n.title || 'Madrid Casa Elevada', {
    body: n.body || '',
    icon: '/MADRID%20LOGO%20MUSGO-01-01.png',
    badge: '/MADRID%20LOGO%20MUSGO-01-01.png',
    tag: data.tag || 'madrid-visita',
    data: data,
    requireInteraction: false
  });
});

// Ao tocar na notificação: foca uma aba aberta do sistema ou abre uma nova.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
      for (let i = 0; i < list.length; i++) {
        if ('focus' in list[i]) return list[i].focus();
      }
      if (clients.openWindow) return clients.openWindow('/#agenda');
    })
  );
});
