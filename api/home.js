// GET /  (عبر rewrite في vercel.json) -> الصفحة الرئيسية: عنوان وصورة من games.json (home) وبطاقة تدخل على /play، ثم كل تطبيقات `apps` مع زرّي تشغيل وفتح نافذة (بلا تثبيت)
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const crypto = require('crypto');
// رقم نسخة للشعار في الرابط كي لا يبقى المتصفح على صورة قديمة مخزّنة
const ver = (v) => crypto.createHash('md5').update(String(v || '')).digest('hex').slice(0, 8);
const slug = (u) => { try { return new URL(u).hostname.replace(/[^a-z0-9]+/gi, '-').toLowerCase(); } catch (e) { return ''; } };
// أيقونتا الزرّين: تشغيل (مثلث) وفتح في نافذة أخرى (سهم خارج مربع)
const PLAY_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
const WIN_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>';

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
.acts{flex:none;display:flex;flex-wrap:wrap;gap:10px}
.ib{flex:1 1 auto;display:flex;align-items:center;justify-content:center;gap:6px;border:0;border-radius:12px;padding:11px 14px;font:inherit;font-size:15px;font-weight:600;color:#fff;white-space:nowrap;cursor:pointer;transition:opacity .15s}
.ib:hover{opacity:.88}
.ib svg{flex:none}
.ib.play{background:#2e9e4f}
.ib.win{background:#039be5}
#toast{position:fixed;inset-inline:16px;bottom:22px;z-index:100;max-width:420px;margin:auto;padding:12px 16px;border-radius:16px;background:var(--text);color:#fff;font-size:15px;line-height:1.7;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.3);transition:opacity .3s ease}
#toast[hidden]{display:none}
@media(max-width:560px){.card{flex-wrap:wrap}.body{flex:1 1 calc(100% - 100px)}.go{width:100%;text-align:center}.app img{width:84px;height:84px}.app .acts{width:100%}}
@media(min-width:720px){
main{max-width:1100px;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
.sec{grid-column:1/-1}
.card{flex-direction:column;align-items:stretch;text-align:center;padding:14px}
.card>img{align-self:center}.app>img{align-self:stretch;width:100%;height:170px}
.body{flex:1 1 auto}.go,.app .acts{width:100%;text-align:center}
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
${id ? `<div class="acts"><button class="ib play" type="button" data-id="${esc(id)}" data-url="${esc(g.url)}" aria-label="تشغيل" title="تشغيل">${PLAY_SVG}<span>تشغيل</span></button><button class="ib win" type="button" data-url="${esc(g.url)}" aria-label="فتح في نافذة أخرى" title="فتح في نافذة أخرى">${WIN_SVG}<span>فتح نافذة</span></button></div>` : ''}
</div>`;
  }).join('\n')}` : ''}
</main>
<div id="toast" role="status" hidden></div>
<script>
var UA=navigator.userAgent||'',
  MOB=/Android|iPhone|iPad|iPod|Mobile/i.test(UA)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),
  INAPP=/FBAN|FBAV|Instagram|Line[/]|MicroMessenger|Snapchat|TikTok|Telegram|WhatsApp|; wv[)]/i.test(UA),
  standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
var tt=null;
function toast(t,ms){var e=document.getElementById('toast');e.textContent=t;e.hidden=false;e.style.opacity='1';clearTimeout(tt);
  tt=setTimeout(function(){e.style.opacity='0';setTimeout(function(){e.hidden=true},300)},ms||6000)}
/* تشغيل: على الموبايل تُفتح صفحة التطبيق داخل المتجر (/game) بتلاشٍ ولا يخرج المستخدم منه. الحاسوب: يفتح موقع التطبيق مباشرةً */
function play(id,url){var u=MOB?'/game?id='+encodeURIComponent(id)+'&from=home':url;
  document.body.style.transition='opacity .45s ease';document.body.style.opacity='0';
  setTimeout(function(){location.href=u},450)}
/* فتح في نافذة أخرى: يفتح موقع التطبيق كصفحة ويب عادية في المتصفح خارج المتجر، وهناك يظهر تثبيته المستقل إن كان يدعمه */
function openWin(url){
  var done=false;
  if(standalone&&/Android/i.test(UA)&&!INAPP){
    try{var x=new URL(url);
      location.href='intent://'+x.host+x.pathname+x.search+x.hash+'#Intent;scheme='+x.protocol.replace(':','')+';package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(url)+';end';
      done=true}catch(e){}}
  if(!done){var a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove()}
  var seen=false;try{seen=localStorage.getItem('pk_tip_win')==='1';localStorage.setItem('pk_tip_win','1')}catch(e){}
  if(!seen)toast('فُتح التطبيق في المتصفح. لتثبيته كتطبيق مستقل اختر «تثبيت التطبيق» من قائمة المتصفح.',9000)}
document.querySelectorAll('.ib.play').forEach(function(b){b.onclick=function(){play(b.getAttribute('data-id'),b.getAttribute('data-url'))}});
document.querySelectorAll('.ib.win').forEach(function(b){b.onclick=function(){openWin(b.getAttribute('data-url'))}});
addEventListener('pageshow',function(){document.body.style.opacity='1'});
if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(function(){});
</script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
  res.status(200).send(html);
};
