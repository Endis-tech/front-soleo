// src/lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyBTS1dc8y0JQpDpzmqK0YE-koV9lrmEdkw",
  authDomain: "soleo-push-pwa.firebaseapp.com",
  projectId: "soleo-push-pwa",
  storageBucket: "soleo-push-pwa.firebasestorage.app",
  messagingSenderId: "414103937774",
  appId: "1:414103937774:web:9c85679be2aac1aaf1c9ff"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);