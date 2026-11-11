// GET /api/logo -> شعار المتجر كصورة (أيقونة تثبيت المتجر). و /api/logo?which=home -> صورة الصفحة الرئيسية
// الصورة تُقدَّم من نطاق المتجر: نمنع أي سكربت داخلها (SVG) من العمل كأنه جزء من الموقع
const secure = (res) => {
  res.setHeader('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox");
  res.setHeader('X-Content-Type-Options', 'nosniff');
};
module.exports = (req, res) => {
  secure(res);
  let data = {};
  try { data = require('../games.json'); } catch (e) {}
  const w = req.query && req.query.which;
  const logo = String((w === 'home' ? (data.home || {}).image : w === 'homelogo' ? (data.home || {}).logo : (data.site || {}).logo) || '');
  const m = logo.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (m) {
    res.setHeader('Content-Type', m[1]);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).send(Buffer.from(m[2], 'base64'));
  }
  if (/^https?:\/\//i.test(logo)) {
    res.setHeader('Location', logo);
    return res.status(302).end();
  }
  res.status(404).end();
};
