// Import the Firebase scripts (Compat versions for Service Workers)
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyBRi-M_iQ8XlxA4gAVculS2JefzPrit1tw",
  appId: "1:1087918076211:web:e2d084ad4c91bd14838e46",
  messagingSenderId: "1087918076211",
  projectId: "device-streaming-aca41bd3",
  authDomain: "device-streaming-aca41bd3.firebaseapp.com",
  storageBucket: "device-streaming-aca41bd3.firebasestorage.app"
});

// Retrieve an instance of Firebase Messaging so it can handle background messages
const messaging = firebase.messaging();