// GET /api/logo -> شعار المتجر كصورة (أيقونة تثبيت المتجر). و /api/logo?which=home -> صورة الصفحة الرئيسية
module.exports = (req, res) => {
  let data = {};
  try { data = require('../games.json'); } catch (e) {}
  const logo = String(((req.query && req.query.which) === 'home' ? (data.home || {}).image : (data.site || {}).logo) || '');
  const m = logo.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
  if (m) {
    res.setHeader('Content-Type', m[1]);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(Buffer.from(m[2], 'base64'));
  }
  if (/^https?:\/\//i.test(logo)) {
    res.setHeader('Location', logo);
    return res.status(302).end();
  }
  res.status(404).end();
};
