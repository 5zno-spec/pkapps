// GET /api/frameable?id=<slug> -> { embeddable: boolean }
// هل يسمح موقع اللعبة/التطبيق بعرضه داخل إطار في هذا المتجر؟ (X-Frame-Options و CSP frame-ancestors)
// إن لم يسمح، تفتحه صفحة /game مباشرةً بدل إطار يعرض «رفض الاتصال».
const slug = (u) => { try { return new URL(u).hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); } catch (e) { return ''; } };

// هل تسمح قائمة frame-ancestors بهذا الأصل؟
function ancestorsAllow(list, origin) {
  const host = new URL(origin).hostname;
  return list.some((s) => {
    if (s === '*' || s === 'https:' || s === origin) return true;
    if (s.startsWith('https://*.')) return host.endsWith(s.slice('https://*'.length));
    if (/^https:\/\/[^*]+$/.test(s)) return s === origin;
    return false;
  });
}

function embeddable(headers, origin) {
  const xfo = String(headers.get('x-frame-options') || '').trim().toLowerCase();
  if (xfo === 'deny' || xfo === 'sameorigin') return false;
  const csp = String(headers.get('content-security-policy') || '');
  for (const part of csp.split(',')) {
    const m = part.split(';').map((x) => x.trim()).find((x) => /^frame-ancestors\s/i.test(x));
    if (m) {
      const list = m.split(/\s+/).slice(1).map((x) => x.toLowerCase());
      if (!ancestorsAllow(list, origin)) return false;
    }
  }
  return true;
}

module.exports = async (req, res) => {
  let data = {};
  try { data = require('../games.json'); } catch (e) {}
  const all = (data.games || []).concat(data.apps || []);
  const id = String((req.query && req.query.id) || '');
  const g = all.find((x) => slug(x.url) === id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const origin = /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? 'https://' + host : 'https://store.wqargroup.com';
  let ok = true; // عند تعذّر الفحص نُبقي السلوك القديم (إطار)
  try {
    const r = await fetch(g.url, { redirect: 'follow', signal: AbortSignal.timeout(4000), headers: { 'user-agent': 'Mozilla/5.0 (frame-check)' } });
    ok = embeddable(r.headers, origin);
  } catch (e) {}
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=600, stale-while-revalidate=3600');
  res.status(200).json({ embeddable: ok });
};
module.exports.embeddable = embeddable;
