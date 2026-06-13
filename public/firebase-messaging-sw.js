// Give the service worker access to Firebase Messaging.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyAdVeBvZJML1Q-9Gen69VKssWs8Ihj0F74",
  authDomain: "rapid-ensign-nxqhd.firebaseapp.com",
  projectId: "rapid-ensign-nxqhd",
  storageBucket: "rapid-ensign-nxqhd.firebasestorage.app",
  messagingSenderId: "795216793995",
  appId: "1:795216793995:web:97318408c3759048e09f8e"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message: ', payload);
  
  const notificationTitle = payload.notification?.title || 'Task Overdue!';
  const notificationOptions = {
    body: payload.notification?.body || 'A task due time has completed.',
    icon: '/assets/logo.png', // Optional asset
    badge: '/assets/badge.png', // Optional asset
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle clicking of background push notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification clicked: ', event.notification.data);
  event.notification.close();

  // Handle URL redirect inside the client environment
  const targetUrl = '/'; // Redirects core route on browser click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
