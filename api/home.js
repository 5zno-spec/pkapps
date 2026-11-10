// GET /  (عبر rewrite في vercel.json) -> الصفحة الرئيسية: عنوان وصورة من games.json (home) وبطاقة تدخل على /play، ثم كل تطبيقات `apps` مع زر التثبيت
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const slug = (u) => { try { return new URL(u).hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); } catch (e) { return ''; } };

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
.sec{margin:8px 0 0;font-size:20px}
.app img{width:120px;height:90px;object-fit:cover;border-radius:16px}.app h3{margin:0}
.ib{flex:none;display:flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:99px;padding:10px 14px;font:inherit;font-size:18px;font-weight:700;color:#fff;text-shadow:0 1px 0 rgba(0,0,0,.25);background:linear-gradient(#4fc3f7,#039be5);box-shadow:0 5px 0 #0277bd,0 8px 14px rgba(0,0,0,.18);cursor:pointer}
.ib.done{background:linear-gradient(#8ef08e,#2fbf4f);box-shadow:0 5px 0 #23913b,0 8px 14px rgba(0,0,0,.18);cursor:default}
.ib.off{background:#bbb;box-shadow:none;text-shadow:none;opacity:.6;cursor:not-allowed}
.ib .ic{display:inline-flex;width:32px;height:32px;border-radius:50%;background:#fff;align-items:center;justify-content:center;flex:none}.ib.off .ic{display:none}
@media(max-width:560px){.card{flex-wrap:wrap}.body{flex:1 1 calc(100% - 100px)}.go{width:100%;text-align:center}.app img{width:84px;height:84px}.app .ib{width:100%}}
@media(min-width:720px){
main{max-width:1100px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
.sec{grid-column:1/-1}
.card{flex-direction:column;align-items:stretch;text-align:center;padding:14px}
.card>img{align-self:center}.app>img{align-self:stretch;width:100%;height:170px}
.body{flex:1 1 auto}.go,.app .ib{width:100%;text-align:center}
}
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
${apps.length ? `<h2 class="sec">التطبيقات</h2>
${apps.map((g) => {
    const id = slug(g.url);
    const im = String(g.image || g.icon || '');
    return `<div class="card app">
${/^https?:\/\//i.test(im) ? `<img src="${esc(im)}" alt="" onerror="this.style.visibility='hidden'">` : ''}
<div class="body"><h3>${esc(g.name)}</h3>${g.desc ? `<p>${esc(g.desc)}</p>` : ''}</div>
${g.pwa && id ? `<button class="ib" type="button" data-id="${esc(id)}"><span class="ic"></span><span class="t">تثبيت</span></button>` : `<button class="ib off" type="button" disabled>غير مهيأ للتثبيت بعد</button>`}
</div>`;
  }).join('\n')}` : ''}
</main>
<script>
var IC='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#039be5" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">',
  DL=IC+'<path d="M12 4v11"/><path d="M6.5 10.5 12 16l5.5-5.5"/><path d="M5 20h14"/></svg>',OK=IC+'<path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
function isInst(id){try{return localStorage.getItem('pk_inst_'+id)==='1'}catch(e){return false}}
function paint(){document.querySelectorAll('button[data-id]').forEach(function(b){
  var id=b.getAttribute('data-id'),on=isInst(id);
  b.className='ib'+(on?' done':'');b.querySelector('.ic').innerHTML=on?OK:DL;
  b.querySelector('.t').textContent=on?'مثبت':'تثبيت';
  b.onclick=on?null:function(){document.body.style.transition='opacity .45s ease';document.body.style.opacity='0';
    setTimeout(function(){location.href='/game?id='+encodeURIComponent(id)+'&install=1'},450)}})}
addEventListener('pageshow',function(){document.body.style.opacity='1';paint()});
addEventListener('storage',paint);
paint();
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(function(){});
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
};
