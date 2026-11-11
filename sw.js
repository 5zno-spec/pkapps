// Service worker: يجعل المتجر (/play) والصفحة الرئيسية (/) وصفحة التشغيل (/game) تعمل بلا إنترنت.
// ملاحظة: الألعاب والتطبيقات نفسها مواقع مستقلة تُعرض داخل إطار على نطاقات أخرى، ولا يستطيع هذا الملف تخزينها؛
// تعمل بلا إنترنت فقط إن كان لكل منها service worker خاص بها.
// عند أي تعديل على منطق التخزين ارفع رقم VERSION ليُحذف الكاش القديم.
const VERSION = 'v1';
const MAIN = 'pk-main-' + VERSION;   // صفحات المتجر + games.json + /api/manifest|icon|logo
const CROSS = 'pk-cross-' + VERSION; // صور وخطوط وأنماط من نطاقات أخرى (صور الألعاب، Google Fonts)
const MAX_CROSS = 80;                // أقصى عدد عناصر في كاش النطاقات الأخرى
const NET_TIMEOUT = 4000;            // بعد هذه المدة (مللي ثانية) نعرض النسخة المخزّنة ونكمل التحديث في الخلفية
const PAGES = ['/', '/play', '/game'];
const PRECACHE = PAGES.concat(['/games.json', '/api/manifest']);
const SAME_API = ['/api/manifest', '/api/icon', '/api/logo'];

const isHttp = (u) => /^https?:\/\//i.test(String(u || ''));
const slug = (u) => { try { return new URL(u).hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); } catch (e) { return ''; } };

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil((async () => {
    const c = await caches.open(MAIN);
    // فشل عنصر واحد لا يُفشل التثبيت
    await Promise.all(PRECACHE.map(async (p) => {
      try {
        const r = await fetch(p, { cache: 'reload' });
        if (r.ok && !r.redirected) await c.put(p, r);
      } catch (err) {}
    }));
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) {
      if (k.startsWith('pk-') && k !== MAIN && k !== CROSS) await caches.delete(k);
    }
    await self.clients.claim();
    await warm();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  let url;
  try { url = new URL(req.url); } catch (err) { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (url.origin === self.location.origin) {
    if (req.mode === 'navigate') {
      // صفحات المتجر فقط؛ لوحة التحكم /Muder وغيرها تذهب للشبكة كما هي
      if (PAGES.includes(url.pathname)) e.respondWith(page(e, url));
    } else if (url.pathname === '/games.json') {
      // لوحة التحكم تطلبه بـ no-store لتقارن بالنسخة الحقيقية: لا نتدخل
      if (req.cache === 'no-store' || req.cache === 'reload') return;
      e.respondWith(networkFirst(e, req, url.origin + url.pathname));
    } else if (SAME_API.includes(url.pathname)) {
      e.respondWith(swr(e, req, MAIN, false));
    }
  } else if (req.destination === 'image' || req.destination === 'font' || req.destination === 'style') {
    e.respondWith(swr(e, req, CROSS, true));
  }
});

// الشبكة أولًا (ليرى المستخدم آخر تحديث)، وإن فشلت أو تأخرت نعرض النسخة المخزّنة
async function networkFirst(e, req, key) {
  const c = await caches.open(MAIN);
  const net = fetch(req).then(async (r) => {
    if (r.ok && !r.redirected) { try { await c.put(key, r.clone()); } catch (err) {} }
    return r;
  });
  net.catch(() => {});
  const timer = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), NET_TIMEOUT));
  try {
    return await Promise.race([net, timer]);
  } catch (err) {
    const hit = await c.match(key);
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net; // لا نسخة مخزّنة: ننتظر الشبكة (وترمي الخطأ إن كنا بلا إنترنت)
  }
}

// صفحات المتجر: تُخزَّن بمسارها دون query (/game?id=.. و /game?id=..&from=store نفس الملف)
async function page(e, url) {
  try {
    return await networkFirst(e, e.request, url.origin + url.pathname);
  } catch (err) {
    const c = await caches.open(MAIN);
    return (await c.match(url.origin + '/play')) || (await c.match(url.origin + '/')) || offline();
  }
}

// النسخة المخزّنة فورًا، وتُحدَّث في الخلفية للمرة القادمة
async function swr(e, req, name, cross) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  const net = (cross ? fetchCross(req.url) : fetch(req)).then(async (r) => {
    if (r.ok || r.type === 'opaque') {
      try { await c.put(req, r.clone()); if (cross) await trim(c, MAX_CROSS); } catch (err) {}
    }
    return r;
  });
  if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
  return net;
}

// نطلب بـ CORS أولًا (استجابة حقيقية تُحسب مساحتها بدقة)، وإن لم يسمح الموقع نرجع لطلب عادي (opaque)
function fetchCross(url) {
  return fetch(url, { mode: 'cors', credentials: 'omit' }).catch(() => fetch(url, { mode: 'no-cors' }));
}

async function trim(c, max) {
  const keys = await c.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => c.delete(k)));
}

function offline() {
  return new Response('<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>لا يوجد اتصال</title></head>' +
    '<body style="font-family:Tahoma,Arial,sans-serif;text-align:center;padding:48px 20px;background:#1b1636;color:#fff"><h2>لا يوجد اتصال بالإنترنت</h2>' +
    '<p>افتح الصفحة مرة واحدة وأنت متصل لتعمل بعدها بلا إنترنت.</p>' +
    '<button onclick="location.reload()" style="font:inherit;padding:10px 24px;border:0;border-radius:99px">إعادة المحاولة</button></body></html>',
  { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// تسخين الكاش بعد التفعيل: صور الألعاب والأيقونات والشعارات والخط، كي تظهر بلا إنترنت حتى لو لم تُفتح الصفحة متصلًا بعد
async function warm() {
  try {
    const c = await caches.open(MAIN);
    const x = await caches.open(CROSS);
    const hit = await c.match('/games.json');
    const d = hit ? await hit.clone().json() : {};
    const list = Array.isArray(d) ? d : [].concat(d.games || [], d.apps || []);
    const cross = new Set();
    const same = new Set();
    const add = (u) => { if (isHttp(u)) cross.add(u); };
    list.forEach((g) => {
      add(g.image); add(g.icon);
      const id = slug(g.url);
      if (id) same.add('/api/icon?id=' + encodeURIComponent(id));
    });
    if (d.home) { add(d.home.image); add(d.home.logo); }
    if (d.site) add(d.site.logo);
    const home = await c.match('/');
    if (home) {
      const t = await home.clone().text();
      (t.match(/\/api\/logo\?[^"'\s<>]+/g) || []).forEach((u) => same.add(u.replace(/&amp;/g, '&')));
      (t.match(/https:\/\/fonts\.googleapis\.com\/css2?\?[^"'\s<>]+/g) || []).forEach((u) => cross.add(u.replace(/&amp;/g, '&')));
    }
    const fonts = new Set();
    const grab = async (urls, cache, isCross) => {
      await Promise.all(Array.from(urls).slice(0, MAX_CROSS).map(async (u) => {
        try {
          if (await cache.match(u)) return;
          const r = isCross ? await fetchCross(u) : await fetch(u);
          if (!(r.ok || r.type === 'opaque')) return;
          if (isCross && r.type !== 'opaque' && /fonts\.googleapis\.com/.test(u)) {
            const css = await r.clone().text();
            (css.match(/https:\/\/fonts\.gstatic\.com\/[^)'"\s]+/g) || []).forEach((f) => fonts.add(f));
          }
          await cache.put(u, r);
        } catch (err) {}
      }));
    };
    await grab(same, c, false);
    await grab(cross, x, true);
    await grab(fonts, x, true);
  } catch (err) {}
}
