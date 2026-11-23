// Vercel Serverless Function: /api/meta?url=https://game.vercel.app
const { admin, safeFetch, readCapped } = require('./_net');
const MAX_PAGE = 2 * 1024 * 1024;
// يحوّل رموز HTML مثل &amp; و&#39; إلى حروفها (تأتي هكذا في الوصف والروابط داخل وسوم meta)
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const ent = (s) => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  const k = e.toLowerCase();
  if (k[0] === '#') {
    const n = k[1] === 'x' ? parseInt(k.slice(2), 16) : parseInt(k.slice(1), 10);
    try { return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : m; } catch { return m; }
  }
  return NAMED[k] || m;
});
// أكبر مقاس في sizes (مثل "48x48 192x192")؛ "any" (عادة SVG) يُعدّ الأكبر
const sizeOf = (s) => {
  const v = String(s || '');
  if (/any/i.test(v)) return 1e6;
  return Math.max(0, ...(v.match(/\d+/g) || []).map(Number));
};

module.exports = async (req, res) => {
  // اسم المستخدم وكلمة المرور من متغيرات البيئة في Vercel: ADMIN_USER و ADMIN_PASSWORD
  if (!(await admin(req))) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (req.query.check) return res.status(200).json({ ok: true });
  try {
    const signal = AbortSignal.timeout(7000);
    const first = new URL(req.query.url);
    const { r: page, url: u } = await safeFetch(first, { signal });
    const html = (await readCapped(page, MAX_PAGE)).toString('utf8');
    const abs = (x) => { try { return new URL(x, u).href; } catch { return ''; } };
    const meta = (k) => {
      const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + k + '["\'][^>]*>', 'i')) ||
                html.match(new RegExp('<meta[^>]+content=["\'][^"\']*["\'][^>]+(?:property|name)=["\']' + k + '["\'][^>]*>', 'i'));
      const c = m && m[0].match(/content=["']([^"']*)["']/i);
      return c ? ent(c[1]) : '';
    };
    const link = (rel) => {
      const m = html.match(new RegExp('<link[^>]+rel=["\'][^"\']*' + rel + '[^"\']*["\'][^>]*>', 'i'));
      const h = m && m[0].match(/href=["']([^"']*)["']/i);
      return h ? abs(ent(h[1])) : '';
    };
    const title = ent((html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '');
    let out = {
      url: first.href,
      title: (meta('og:title') || title).trim(),
      description: (meta('og:description') || meta('description')).trim(),
      image: abs(meta('og:image')),
      icon: link('apple-touch-icon') || link('icon'),
      pwa: false
    };
    const mf = link('manifest');
    if (mf) {
      try {
        const { r: mr, url: mu } = await safeFetch(mf, { signal });
        const m = JSON.parse((await readCapped(mr, MAX_PAGE)).toString('utf8'));
        out.pwa = !!(m.icons && m.icons.length && (m.start_url || m.display));
        out.title = out.title || m.name || m.short_name || '';
        out.description = out.description || m.description || '';
        if (m.icons && m.icons.length) {
          const best = m.icons.slice().sort((a, b) => sizeOf(b.sizes) - sizeOf(a.sizes))[0];
          out.icon = new URL(best.src, mu).href;
        }
      } catch {}
    }
    out.image = out.image || out.icon;
    // نقبل فقط روابط صور http(s)
    if (!/^https?:\/\//i.test(out.image)) out.image = '';
    if (!/^https?:\/\//i.test(out.icon)) out.icon = '';
    res.status(200).json(out);
  } catch (e) {
    res.status(400).json({ error: 'تعذر جلب بيانات الرابط' });
  }
};
