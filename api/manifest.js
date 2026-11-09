// GET /api/manifest?id=<slug>  -> manifest خاص بكل لعبة (يُستخدم للتثبيت من المتجر مباشرة)
const slug = (u) => { try { return new URL(u).hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); } catch (e) { return ''; } };
const TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon' };

const COLOR = /^(#[0-9a-f]{3,8}|[a-z]+|(rgb|hsl)a?\([\d\s.,%/a-z]+\))$/i;
const okColor = (c) => (typeof c === 'string' && c.length <= 40 && COLOR.test(c.trim()) ? c.trim() : '');
// يقرأ ألوان اللعبة نفسها (background_color / theme_color) من manifest اللعبة
async function gameColors(url) {
  try {
    const opt = { signal: AbortSignal.timeout(4000), redirect: 'follow' };
    const html = await (await fetch(url, opt)).text();
    const l = html.match(/<link[^>]+rel=["'][^"']*manifest[^"']*["'][^>]*>/i);
    const h = l && l[0].match(/href=["']([^"']*)["']/i);
    if (!h) return {};
    const mf = await (await fetch(new URL(h[1], url).href, opt)).json();
    return { bg: okColor(mf.background_color), theme: okColor(mf.theme_color) };
  } catch (e) { return {}; }
}

module.exports = async (req, res) => {
  let data = {};
  try { data = require('../games.json'); } catch (e) {}
  const games = Array.isArray(data) ? data : (data.games || []);
  const site = data.site || {};
  const id = String(req.query.id || '');
  if (!id) {
    // manifest المتجر نفسه (عند فتح الصفحة الرئيسية بلا id)
    const logo = String(site.logo || '');
    const isData = /^data:image\//i.test(logo);
    const src = isData ? '/api/logo' : logo;
    const mime = isData ? (logo.match(/^data:(image\/[a-z0-9.+-]+)/i) || [])[1] : TYPES[((src.split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase()];
    const icon = (sizes) => Object.assign({ src, sizes, purpose: 'any' }, mime ? { type: mime } : {});
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).send(JSON.stringify({
      id: '/',
      name: site.name || 'ألعاب الصغار',
      short_name: String(site.name || 'المتجر').slice(0, 12),
      start_url: '/',
      scope: '/',
      display: 'standalone',
      background_color: '#1b1636',
      theme_color: '#7c4dff',
      lang: 'ar',
      dir: 'rtl',
      icons: src ? [icon('256x256')] : []
    }));
  }
  const g = games.find((x) => slug(x.url) === id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const src = g.icon || g.image || site.logo || '';
  const ext = ((src.split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();
  const mk = (sizes) => Object.assign({ src, sizes, purpose: 'any' }, TYPES[ext] ? { type: TYPES[ext] } : {});
  const start = '/play?id=' + id;
  const col = await gameColors(g.url);

  res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.status(200).send(JSON.stringify({
    id: start,
    name: g.name,
    short_name: String(g.name || '').slice(0, 12),
    description: g.desc || '',
    start_url: start,
    scope: '/',
    display: 'standalone',
    background_color: col.bg || '#1b1636',
    theme_color: col.theme || col.bg || '#7c4dff',
    lang: 'ar',
    dir: 'rtl',
    icons: src ? [mk('192x192'), mk('512x512')] : []
  }));
};
