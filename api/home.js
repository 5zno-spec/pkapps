// GET /  (عبر rewrite في vercel.json) -> الصفحة الرئيسية: عنوان وصورة من games.json (home) وبطاقة تدخل على /play
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

module.exports = (req, res) => {
  let data = {};
  try { data = require('../games.json'); } catch (e) {}
  const site = (data && data.site) || {};
  const home = (data && data.home) || {};
  const apps = Array.isArray(data && data.apps) ? data.apps : [];

  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const origin = /^[a-z0-9.-]+(:\d+)?$/i.test(host) ? 'https://' + host : 'https://store.wqargroup.com';

  const name = site.name || 'ألعاب الصغار';
  const title = String(home.title || name);
  const desc = String(home.desc || site.desc || '');
  const img = String(home.image || '');
  // الصورة: رابط مباشر، أو data: تُقدَّم عبر /api/logo?which=home، أو الصورة الافتراضية
  const imgSrc = /^https?:\/\//i.test(img) ? img : /^data:image\//i.test(img) ? '/api/logo?which=home' : '';
  const ogImg = imgSrc ? new URL(imgSrc, origin).href : origin + '/og-image.jpg';
  const logo = String(site.logo || '');
  const cardImg = /^https?:\/\//i.test(logo) ? logo : /^data:image\//i.test(logo) ? '/api/logo' : '';
  // شعار هيدر الجذر (متجر وقار): شعاره الخاص، وإلا شعار متجر الأطفال احتياطًا
  const hl = String(home.logo || '');
  const headImg = /^https?:\/\//i.test(hl) ? hl : /^data:image\//i.test(hl) ? '/api/logo?which=homelogo' : cardImg;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(name)}">
<meta property="og:locale" content="ar_AR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${esc(origin)}/">
<meta property="og:image" content="${esc(ogImg)}">
<meta property="og:image:alt" content="${esc(title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(ogImg)}">
${cardImg ? `<link rel="icon" href="${esc(cardImg)}">` : ''}
<style>
:root{color-scheme:light;--bg:#fff;--card:#fff;--text:#2b2350;--muted:#6b6490;--brand:#7c4dff;--line:#eadfc8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:"Segoe UI",Tahoma,Arial,sans-serif}
header{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:10px 16px;background:#fff;border-bottom:1px solid #eee;box-shadow:0 6px 22px rgba(43,35,80,.18);animation:hdrIn .6s cubic-bezier(.2,.9,.3,1.2) both}
header img{width:48px;height:48px;object-fit:contain;border-radius:14px;flex:none;animation:logoFloat 3.2s ease-in-out infinite}
header b{font-size:clamp(18px,4.6vw,26px);line-height:1.2;background:linear-gradient(90deg,#7c4dff,#ff6ec7,#4fc3f7,#7c4dff);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;-webkit-text-fill-color:transparent;animation:nameShine 6s linear infinite}
@keyframes hdrIn{from{transform:translateY(-100%);opacity:0}to{transform:none;opacity:1}}
@keyframes logoFloat{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-3px) rotate(-4deg)}}
@keyframes nameShine{to{background-position:-250% 0}}
@media(prefers-reduced-motion:reduce){header,header img,header b{animation:none}}
.hero{max-width:760px;margin:auto;padding:20px 16px 8px;text-align:center}
.hero img{display:block;width:100%;max-height:300px;object-fit:contain;border-radius:24px;margin:0 0 16px;background:#fff}
h1{margin:0 0 8px;font-size:clamp(22px,5.5vw,32px);line-height:1.3}
.hero p{margin:0;color:var(--muted);line-height:1.7}
main{max-width:760px;margin:auto;padding:12px 16px 40px;display:grid;gap:14px}
.card{display:flex;align-items:center;gap:14px;padding:12px;background:var(--card);border:2px solid var(--line);border-radius:22px;color:inherit;text-decoration:none;transition:transform .15s ease}
.card:hover{transform:translateY(-2px)}
.card img{width:84px;height:84px;flex:none;object-fit:contain;border-radius:18px;background:var(--line)}
.body{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.body h2{margin:0;font-size:20px}.body p{margin:0;color:var(--muted);font-size:14px;line-height:1.6}
.go{flex:none;border-radius:99px;padding:10px 22px;font-weight:700;font-size:18px;color:#fff;background:linear-gradient(#ff8fb1,#ff4f87);box-shadow:0 5px 0 #c9336a,0 8px 14px rgba(0,0,0,.18)}
@media(max-width:560px){.card{flex-wrap:wrap}.body{flex:1 1 calc(100% - 100px)}.go{width:100%;text-align:center}}
</style>
</head>
<body>
<header>${headImg ? `<img src="${esc(headImg)}" alt="">` : ''}<b>${esc(title)}</b></header>
<section class="hero">
${imgSrc ? `<img src="${esc(imgSrc)}" alt="">` : ''}
<h1>${esc(title)}</h1>
${desc ? `<p>${esc(desc)}</p>` : ''}
</section>
<main>
<a class="card" href="/play">
${cardImg ? `<img src="${esc(cardImg)}" alt="">` : ''}
<div class="body"><h2>${esc(name)}</h2>${site.desc ? `<p>${esc(site.desc)}</p>` : ''}</div>
<span class="go">دخول</span>
</a>
${apps.length ? `<a class="card" href="/apps">
<div class="body"><h2>التطبيقات</h2><p>تطبيقات جاهزة للتثبيت</p></div>
<span class="go">دخول</span>
</a>` : ''}
</main>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
};
