// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBTS1dc8y0JQpDpzmqK0YE-koV9lrmEdkw",
  authDomain: "soleo-push-pwa.firebaseapp.com",
  projectId: "soleo-push-pwa",
  storageBucket: "soleo-push-pwa.firebasestorage.app",
  messagingSenderId: "414103937774",
  appId: "1:414103937774:web:9c85679be2aac1aaf1c9ff"
};

// 👇 Usa initializeApp (sin "firebase.")
firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// ✅ Corrección: sintaxis correcta de onBackgroundMessage
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Notificación en background:', payload);

  const notificationTitle = payload.notification.title || 'Sóleo';
  const notificationOptions = {
    body: payload.notification.body || 'Tienes una nueva notificación',
    icon: '/icons/icon192x192.png', // asegúrate de que esta ruta sea pública
    badge: '/icons/icon192x192.png'
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});