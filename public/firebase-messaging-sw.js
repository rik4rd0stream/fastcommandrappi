/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB8ojoSzZRfgw6PRPTZ-fF3NfZRCJArt5M",
  authDomain: "motoboy-13742.firebaseapp.com",
  projectId: "motoboy-13742",
  storageBucket: "motoboy-13742.firebasestorage.app",
  messagingSenderId: "224481701159",
  appId: "1:224481701159:web:fe86a0fd8404adb876cd02",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const data = payload.data || {};
  const title = data.title || payload.notification?.title || "Nova Solicitação";
  const body = data.body || payload.notification?.body || "";
  const whatsappUrl = data.whatsappUrl || "";

  const options = {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: { whatsappUrl },
    actions: [
      {
        action: "aceitar",
        title: "✅ Aceitar",
      },
    ],
  };

  self.registration.showNotification(title, options);
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[firebase-messaging-sw.js] Notification click:", event.action);
  event.notification.close();

  const whatsappUrl = event.notification.data?.whatsappUrl;

  if (event.action === "aceitar" && whatsappUrl) {
    event.waitUntil(clients.openWindow(whatsappUrl));
  } else if (whatsappUrl) {
    // Clicking the notification body also opens WhatsApp
    event.waitUntil(clients.openWindow(whatsappUrl));
  }
});
