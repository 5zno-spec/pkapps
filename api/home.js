// GET /  (عبر rewrite في vercel.json) -> الصفحة الرئيسية: عنوان وصورة من games.json (home) وبطاقة تدخل على /play، ثم كل تطبيقات `apps` مع زر التثبيت
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const crypto = require('crypto');
// رقم نسخة للشعار في الرابط كي لا يبقى المتصفح على صورة قديمة مخزّنة
const ver = (v) => crypto.createHash('md5').update(String(v || '')).digest('hex').slice(0, 8);
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
  const imgSrc = /^https?:\/\//i.test(img) ? img : /^data:image\//i.test(img) ? '/api/logo?which=home&v=' + ver(home.image) : '';
  const ogImg = imgSrc ? new URL(imgSrc, origin).href : origin + '/og-image.jpg';
  const logo = String(site.logo || '');
  const cardImg = /^https?:\/\//i.test(logo) ? logo : /^data:image\//i.test(logo) ? '/api/logo?v=' + ver(site.logo) : '';
  // شعار هيدر الجذر (متجر وقار): شعاره الخاص، وإلا شعار متجر الأطفال احتياطًا
  const hl = String(home.logo || '');
  const headImg = /^https?:\/\//i.test(hl) ? hl : /^data:image\//i.test(hl) ? '/api/logo?which=homelogo&v=' + ver(home.logo) : cardImg;

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(title)}">
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
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Tajawal:wght@700&display=swap">
${headImg ? `<link rel="icon" href="${esc(headImg)}">` : ''}
<style>
:root{color-scheme:light;--bg:#fff;--card:#fff;--text:#2b2350;--muted:#6b6490;--brand:#7c4dff;--line:#eadfc8}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:"Segoe UI",Tahoma,Arial,sans-serif}
header{position:sticky;top:0;z-index:50;display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:10px 16px;background:#fff;border-bottom:1px solid #eee;box-shadow:0 2px 10px rgba(43,35,80,.1)}
header img{height:48px;width:auto;max-width:64px;object-fit:contain;flex:none}
header b{font-family:"Tajawal","Segoe UI",Tahoma,Arial,sans-serif;font-weight:700;font-size:clamp(18px,4.6vw,26px);line-height:1.2;color:#000}
main{max-width:760px;margin:auto;padding:20px 16px 40px;display:grid;gap:14px}
.card{display:flex;align-items:center;gap:14px;padding:12px;background:var(--card);border:2px solid var(--line);border-radius:22px;color:inherit;text-decoration:none;transition:transform .15s ease}
.card:hover{transform:translateY(-2px)}
.card img{width:84px;height:84px;flex:none;object-fit:contain;border-radius:18px;background:var(--line)}
.body{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px}
.body h2{margin:0;font-size:20px}.body p{margin:0;color:var(--muted);font-size:14px;line-height:1.6}
.go{flex:none;border-radius:99px;padding:10px 22px;font-weight:700;font-size:18px;color:#fff;background:linear-gradient(#ff8fb1,#ff4f87);box-shadow:0 5px 0 #c9336a,0 8px 14px rgba(0,0,0,.18)}
.sec{margin:8px 0 0;font-size:20px}
.app img{width:120px;height:90px;object-fit:cover;border-radius:16px}.app h3{margin:0}
.ib{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:12px;padding:11px 22px;font:inherit;font-size:16px;font-weight:600;color:#fff;background:#039be5;cursor:pointer;transition:opacity .15s}
.ib:hover{opacity:.88}
.ib.done{background:#2e9e4f;color:#fff;cursor:pointer}
.ib.off{background:#eee;color:#888;cursor:not-allowed}
.ib .ic{display:inline-flex;width:20px;height:20px;align-items:center;justify-content:center;flex:none}.ib.off .ic{display:none}
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
${g.pwa && id ? `<button class="ib" type="button" data-id="${esc(id)}" data-url="${esc(g.url)}"><span class="ic"></span><span class="t">تثبيت</span></button>` : `<button class="ib off" type="button" disabled>غير مهيأ للتثبيت بعد</button>`}
</div>`;
  }).join('\n')}` : ''}
</main>
<script>
var IC='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">',
  DL=IC+'<path d="M12 4v11"/><path d="M6.5 10.5 12 16l5.5-5.5"/><path d="M5 20h14"/></svg>',OK=IC+'<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';
function isInst(id){try{return localStorage.getItem('pk_inst_'+id)==='1'}catch(e){return false}}
function paint(){document.querySelectorAll('button[data-id]').forEach(function(b){
  var id=b.getAttribute('data-id'),on=isInst(id);
  b.className='ib'+(on?' done':'');b.querySelector('.ic').innerHTML=on?OK:DL;
  b.querySelector('.t').textContent=on?'فتح':'تثبيت';
  b.onclick=on?function(){/* فتح التطبيق المثبّت: رابط حقيقي داخل نطاق التطبيق كي يلتقطه نظام التشغيل ويفتحه في التطبيق المثبّت */
    var a=document.createElement('a');a.href=b.getAttribute('data-url');a.target='_blank';a.rel='noopener';
    document.body.appendChild(a);a.click();a.remove()}:function(){document.body.style.transition='opacity .45s ease';document.body.style.opacity='0';
    setTimeout(function(){location.href=b.getAttribute('data-url')},450)}})}
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
