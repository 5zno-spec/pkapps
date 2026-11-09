// Service worker بسيط: يلزم المتصفح لاعتبار الموقع قابلاً للتثبيت
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {});
