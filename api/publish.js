// Vercel Serverless Function: POST /api/publish  -> يحدّث games.json في مستودع GitHub
const crypto = require('crypto');
const same = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const dec = (v) => { try { return decodeURIComponent(v || ''); } catch { return ''; } };

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const user = process.env.ADMIN_USER, pw = process.env.ADMIN_PASSWORD;
  if (!(user && pw && same(dec(req.headers['x-admin-user']), user) && same(dec(req.headers['x-admin-password']), pw))) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const token = process.env.GITHUB_TOKEN, repo = process.env.GITHUB_REPO;
  if (!token || !repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return res.status(500).json({ error: 'أضف GITHUB_TOKEN و GITHUB_REPO (بصيغة اسمك/المستودع) في Vercel' });
  }

  let data = req.body;
  if (typeof data === 'string') { try { data = JSON.parse(data); } catch { data = null; } }
  if (!data || typeof data !== 'object' || !data.site || !Array.isArray(data.games)) {
    return res.status(400).json({ error: 'بيانات غير صالحة' });
  }
  // الروابط تُفتح في المتصفح مباشرة: نقبل https فقط للألعاب، وhttp(s) أو صورة data: للصور
  const okUrl = (v) => { try { return new URL(v).protocol === 'https:'; } catch { return false; } };
  const okImg = (v) => !v || /^https?:\/\//i.test(v) || /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(v);
  const items = data.games.concat(Array.isArray(data.apps) ? data.apps : []);
  const bad = items.find((g) => !g || !okUrl(g.url) || !okImg(g.image) || !okImg(g.icon));
  if (bad) return res.status(400).json({ error: 'رابط غير صالح: ' + String((bad && bad.name) || (bad && bad.url) || '').slice(0, 80) });
  const site = data.site || {}, home = data.home || {};
  if (![site.logo, home.logo, home.image].every(okImg)) return res.status(400).json({ error: 'رابط شعار أو صورة غير صالح' });
  const content = JSON.stringify(data, null, 2);
  if (Buffer.byteLength(content) > 900000) return res.status(413).json({ error: 'الملف كبير جداً (صغّر الشعار)' });

  const api = `https://api.github.com/repos/${repo}/contents/games.json`;
  const h = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'kids-store-admin',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  try {
    let sha;
    const g = await fetch(api, { headers: h });
    if (g.ok) sha = (await g.json()).sha;
    else if (g.status !== 404) return res.status(502).json({ error: 'GitHub ' + g.status + ' (تحقق من المفتاح واسم المستودع)' });

    const p = await fetch(api, {
      method: 'PUT',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update games.json from admin',
        content: Buffer.from(content).toString('base64'),
        sha
      })
    });
    if (!p.ok) return res.status(502).json({ error: 'GitHub ' + p.status + ' (تحقق من صلاحية Contents: Read and write)' });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(502).json({ error: 'تعذر الاتصال بـ GitHub' });
  }
};
