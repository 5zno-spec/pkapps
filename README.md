# متجر ألعاب الأطفال

## النشر
1. ارفع محتويات هذا المجلد إلى مستودع GitHub.
2. في Vercel: Add New > Project > اختر المستودع، وقبل Deploy افتح Environment Variables وأضف `ADMIN_PASSWORD` بكلمة مرور قوية (أو أضفها لاحقاً من Settings ثم Redeploy).
3. افتح `/Muder` لإدارة المتجر، ثم نزّل `games.json` واستبدل به الملف في المستودع.

## الملفات
- `index.html` : المتجر
- `Muder.html` : لوحة التحكم
- `api/meta.js` : دالة Vercel لجلب صورة ووصف اللعبة والتحقق من PWA
- `games.json` : الإعدادات والألعاب
- `vercel.json` : يجعل الرابط /Muder يعمل بدون .html
