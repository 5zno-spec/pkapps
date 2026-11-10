// GET /api/icon?id=<slug> -> أيقونة اللعبة/التطبيق من نفس نطاق المتجر.
// تُجلب من الخادم (فلا يعطّلها منع الإحالة hotlink ولا CORS)، ثم يُرجع شعار المتجر إن تعذّرت.
// تُستعمل في نافذة التثبيت وفي manifest: أيقونة معطوبة تمنع المتصفح من عرض التثبيت أصلًا.
const slug = (u) => { try { return new URL(u).hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); } catch (e) { return ''; } };
const BLOCKED = /^(localhost|.*\.local|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1)/i;
const MAX = 3 * 1024 * 1024;

async function load(src) {
  const m = String(src || '').match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (m) return { type: m[1], body: Buffer.from(m[2], 'base64') };
  let u;
  try { u = new URL(src); } catch (e) { return null; }
  if (!/^https?:$/.test(u.protocol) || BLOCKED.test(u.hostname)) return null;
  try {
    const r = await fetch(u, { redirect: 'follow', signal: AbortSignal.timeout(6000), headers: { 'user-agent': 'Mozilla/5.0 (icon-proxy)', accept: 'image/*,*/*;q=0.5' } });
    const type = String(r.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!r.ok || !/^image\//.test(type)) return null;
    const body = Buffer.from(await r.arrayBuffer());
    return body.length && body.length <= MAX ? { type, body } : null;
  } catch (e) { return null; }
}

module.exports = async (req, res) => {
  let data = {};
  try { data = require('../games.json'); } catch (e) {}
  const id = String((req.query && req.query.id) || '');
  const g = (data.games || []).concat(data.apps || []).find((x) => slug(x.url) === id);
  if (!g) return res.status(404).end();
  const site = data.site || {}, home = data.home || {};
  for (const src of [g.icon, g.image, home.logo, site.logo]) {
    if (!src) continue;
    const f = await load(src);
    if (f) {
      res.setHeader('Content-Type', f.type);
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
      return res.status(200).send(f.body);
    }
  }
  res.status(404).end();
};
