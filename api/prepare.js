// Vercel Serverless Function: POST /api/prepare  {repo:"owner/name"}
// يضيف كود التثبيت إلى index.html في مستودع اللعبة (إن لم يكن موجوداً)
const crypto = require('crypto');
const same = (a, b) => {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const dec = (v) => { try { return decodeURIComponent(v || ''); } catch { return ''; } };

const START = '<!-- kids-store-install:start -->';
const END = '<!-- kids-store-install:end -->';
const SNIPPET = [
  START,
  '<button id="installBtn" hidden style="position:fixed;inset:auto 16px 24px;padding:16px;font-size:20px;z-index:99999">⬇️ ثبّت اللعبة</button>',
  '<script>',
  '(function(){var ev,b=document.getElementById("installBtn");',
  'addEventListener("beforeinstallprompt",function(e){e.preventDefault();ev=e;if(location.search.indexOf("install=1")>-1)b.hidden=false});',
  'b.onclick=async function(){ev.prompt();await ev.userChoice;b.hidden=true}})();',
  '</script>',
  END
].join('\n');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  const user = process.env.ADMIN_USER, pw = process.env.ADMIN_PASSWORD;
  if (!(user && pw && same(dec(req.headers['x-admin-user']), user) && same(dec(req.headers['x-admin-password']), pw))) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) return res.status(500).json({ error: 'أضف GITHUB_TOKEN في Vercel' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  const repo = body && String(body.repo || '').trim();
  if (!repo || !/^[\w.-]+\/[\w.-]+$/.test(repo)) {
    return res.status(400).json({ error: 'اكتب المستودع بصيغة اسمك/المستودع' });
  }

  const h = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'kids-store-admin',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  try {
    let found = null;
    for (const path of ['index.html', 'public/index.html']) {
      const r = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, { headers: h });
      if (r.ok) { found = { path, ...(await r.json()) }; break; }
      if (r.status !== 404) return res.status(502).json({ error: 'GitHub ' + r.status });
    }
    if (!found) return res.status(404).json({ error: 'لم أجد المستودع أو ملف index.html (تحقق من الاسم ومن صلاحية المفتاح على هذا المستودع)' });
    if (found.encoding !== 'base64' || typeof found.content !== 'string') {
      return res.status(422).json({ error: 'ملف index.html كبير أو بصيغة غير مدعومة' });
    }

    const html = Buffer.from(found.content, 'base64').toString('utf8');
    const noManifest = !/rel=["'][^"']*manifest/i.test(html);
    if (html.includes(START) || html.includes('id="installBtn"')) {
      return res.status(200).json({ ok: true, already: true, noManifest });
    }
    const i = html.toLowerCase().lastIndexOf('</body>');
    if (i === -1) return res.status(422).json({ error: 'لم أجد وسم </body> في index.html' });

    const out = html.slice(0, i) + SNIPPET + '\n' + html.slice(i);
    const p = await fetch(`https://api.github.com/repos/${repo}/contents/${found.path}`, {
      method: 'PUT',
      headers: { ...h, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Add install button (kids store)',
        content: Buffer.from(out, 'utf8').toString('base64'),
        sha: found.sha
      })
    });
    if (!p.ok) return res.status(502).json({ error: 'GitHub ' + p.status + ' (تحقق من صلاحية Contents: Read and write على مستودع اللعبة)' });
    res.status(200).json({ ok: true, noManifest });
  } catch (e) {
    res.status(502).json({ error: 'تعذر الاتصال بـ GitHub' });
  }
};
