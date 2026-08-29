self.addEventListener('push', (event) => {
  let data = { title: 'Campus Cakes Update', body: 'You have a new update!' };
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Campus Cakes Update', body: event.data.text() };
    }
  }

  const options = {
    body: data.body,
    icon: '/src/assets/images/brand_logo_1781589358418.jpg',
    badge: '/src/assets/images/brand_logo_1781589358418.jpg',
    vibrate: [100, 50, 100],
    data: {
      url: self.registration.scope
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
