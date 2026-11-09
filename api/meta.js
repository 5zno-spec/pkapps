// Vercel Serverless Function: /api/meta?url=https://game.vercel.app
const crypto = require('crypto');
const same = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
module.exports = async (req, res) => {
  // كلمة المرور تُقرأ من متغير البيئة ADMIN_PASSWORD في Vercel (لا تكتبها في الكود)
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || !same(req.headers['x-admin-password'], pw)) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const u = new URL(req.query.url);
    if (!/^https?:$/.test(u.protocol)) throw new Error('bad protocol');
    if (/^(localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/i.test(u.hostname)) throw new Error('blocked host');
    const opt = { signal: AbortSignal.timeout(7000), redirect: 'follow' };
    const html = await (await fetch(u, opt)).text();
    const abs = (x) => { try { return new URL(x, u).href; } catch { return ''; } };
    const meta = (k) => {
      const m = html.match(new RegExp('<meta[^>]+(?:property|name)=["\']' + k + '["\'][^>]*>', 'i')) ||
                html.match(new RegExp('<meta[^>]+content=["\'][^"\']*["\'][^>]+(?:property|name)=["\']' + k + '["\'][^>]*>', 'i'));
      const c = m && m[0].match(/content=["']([^"']*)["']/i);
      return c ? c[1] : '';
    };
    const link = (rel) => {
      const m = html.match(new RegExp('<link[^>]+rel=["\'][^"\']*' + rel + '[^"\']*["\'][^>]*>', 'i'));
      const h = m && m[0].match(/href=["']([^"']*)["']/i);
      return h ? abs(h[1]) : '';
    };
    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1] || '';
    let out = {
      url: u.href,
      title: (meta('og:title') || title).trim(),
      description: (meta('og:description') || meta('description')).trim(),
      image: abs(meta('og:image')),
      icon: link('apple-touch-icon') || link('icon'),
      pwa: false
    };
    const mf = link('manifest');
    if (mf) {
      try {
        const m = await (await fetch(mf, opt)).json();
        out.pwa = !!(m.icons && m.icons.length && (m.start_url || m.display));
        out.title = out.title || m.name || m.short_name || '';
        out.description = out.description || m.description || '';
        if (m.icons && m.icons.length) {
          const best = m.icons.slice().sort((a, b) => parseInt(b.sizes) - parseInt(a.sizes))[0];
          out.icon = new URL(best.src, mf).href;
        }
      } catch {}
    }
    out.image = out.image || out.icon;
    res.status(200).json(out);
  } catch (e) {
    res.status(400).json({ error: 'تعذر جلب بيانات الرابط' });
  }
};
