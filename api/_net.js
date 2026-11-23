// أدوات مشتركة لدوال api (الملفات التي تبدأ بـ _ لا تصبح دوال في Vercel).
const crypto = require('crypto');
const dns = require('dns').promises;
const net = require('net');

// معرّف اللعبة: اسم النطاق، ويُضاف المسار إن لم يكن الجذر.
// ألعاب الجذر (كل الألعاب الحالية) يبقى معرّفها كما كان، فلا تنكسر الروابط القديمة.
// نسخة مطابقة من هذه الدالة في play.html وgame.html وsw.js: إن غيّرتها فغيّرها هناك أيضًا.
const slug = (u) => {
  try {
    const x = new URL(u);
    const p = x.pathname.replace(/\/+$/, '');
    return (x.hostname + (p ? '-' + p : '')).replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
  } catch (e) { return ''; }
};

// مقارنة ثابتة الزمن لا تكشف حتى طول السر
const same = (a, b) => {
  const h = (v) => crypto.createHash('sha256').update(String(v || '')).digest();
  return !!b && crypto.timingSafeEqual(h(a), h(b));
};
const dec = (v) => { try { return decodeURIComponent(v || ''); } catch { return ''; } };
// يتحقق من اسم المستخدم وكلمة المرور، ويتأخر قليلًا عند الخطأ كي يبطؤ التخمين
async function admin(req) {
  const user = process.env.ADMIN_USER, pw = process.env.ADMIN_PASSWORD;
  const ok = !!(user && pw) &
    same(dec(req.headers['x-admin-user']), user) &
    same(dec(req.headers['x-admin-password']), pw);
  if (!ok) await new Promise((r) => setTimeout(r, 800));
  return !!ok;
}

// عناوين داخلية ممنوعة بالاسم
const BLOCKED_NAME = /^(localhost|.*\.localhost|.*\.local|.*\.internal|.*\.home\.arpa)$/i;
function privateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    const m = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (m) return privateIp(m[1]);
    return x === '::' || x === '::1' || /^f[cd]/.test(x) || /^fe[89ab]/.test(x) || /^ff/.test(x);
  }
  return true;
}
// يرفض أي رابط ليس http(s) أو يشير (مباشرة أو عبر DNS) إلى عنوان داخلي
async function check(u) {
  if (!/^https?:$/.test(u.protocol)) throw new Error('bad protocol');
  const host = u.hostname.replace(/^\[|\]$/g, '');
  if (BLOCKED_NAME.test(host)) throw new Error('blocked host');
  const ips = net.isIP(host) ? [host] : (await dns.lookup(host, { all: true })).map((a) => a.address);
  if (!ips.length || ips.some(privateIp)) throw new Error('blocked host');
}
// يتبع التحويلات يدويًا ويفحص كل عنوان، فلا يستطيع موقع خارجي تحويل الطلب إلى عنوان داخلي
async function safeFetch(url, opt = {}) {
  let u = new URL(url);
  for (let i = 0; i < 5; i++) {
    await check(u);
    const r = await fetch(u, { ...opt, redirect: 'manual' });
    const loc = r.status >= 300 && r.status < 400 && r.headers.get('location');
    if (!loc) return { r, url: u };
    u = new URL(loc, u);
  }
  throw new Error('too many redirects');
}
// يقرأ الجسم مع حدّ أقصى، ويتوقف فور تجاوزه بدل تحميل الملف كله في الذاكرة
async function readCapped(r, max) {
  if (Number(r.headers.get('content-length') || 0) > max) throw new Error('too large');
  if (!r.body) return Buffer.alloc(0);
  const chunks = []; let n = 0;
  for await (const c of r.body) {
    n += c.length;
    if (n > max) { try { await r.body.cancel(); } catch (e) {} throw new Error('too large'); }
    chunks.push(Buffer.from(c));
  }
  return Buffer.concat(chunks);
}
// يقبل الطلب فقط بالمعامِلات المعروفة. أي معامل زائد (مثل ?r=عشوائي لتفادي الكاش) يُحوَّل
// إلى الرابط النظيف، فتجيبه ذاكرة Vercel المؤقتة بدل تشغيل الدالة وجلب الموقع من جديد.
function canonical(req, res, allowed) {
  const q = req.query || {};
  const extra = Object.keys(q).some((k) => !allowed.includes(k));
  const multi = allowed.some((k) => Array.isArray(q[k]));
  if (!extra && !multi) return false;
  const path = String(req.url || '').split('?')[0];
  const qs = allowed.filter((k) => q[k] != null).map((k) => k + '=' + encodeURIComponent(String([].concat(q[k])[0]))).join('&');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  res.writeHead(301, { Location: path + (qs ? '?' + qs : '') });
  res.end();
  return true;
}

module.exports = { slug, same, dec, admin, check, safeFetch, readCapped, canonical, privateIp };
