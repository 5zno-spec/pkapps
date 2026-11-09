// GET /api/manifest?id=<slug>  -> manifest خاص بكل لعبة (يُستخدم للتثبيت من المتجر مباشرة)
const slug = (u) => { try { return new URL(u).hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); } catch (e) { return ''; } };
const TYPES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', svg: 'image/svg+xml', ico: 'image/x-icon' };

module.exports = (req, res) => {
  let data = {};
  try { data = require('../games.json'); } catch (e) {}
  const games = Array.isArray(data) ? data : (data.games || []);
  const site = data.site || {};
  const id = String(req.query.id || '');
  const g = games.find((x) => slug(x.url) === id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const src = g.icon || g.image || site.logo || '';
  const ext = ((src.split('?')[0].match(/\.([a-z0-9]+)$/i) || [])[1] || '').toLowerCase();
  const mk = (sizes) => Object.assign({ src, sizes, purpose: 'any' }, TYPES[ext] ? { type: TYPES[ext] } : {});
  const start = '/play?id=' + id;

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
    background_color: '#1b1636',
    theme_color: '#7c4dff',
    lang: 'ar',
    dir: 'rtl',
    icons: src ? [mk('192x192'), mk('512x512')] : []
  }));
};
