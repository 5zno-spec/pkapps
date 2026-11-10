# ألعاب الصغار

## النشر
1. ارفع محتويات هذا المجلد إلى مستودع GitHub.
2. في Vercel: Add New > Project > اختر المستودع، وقبل Deploy افتح Environment Variables وأضف `ADMIN_USER` (اسم المستخدم) و`ADMIN_PASSWORD` (كلمة مرور قوية) (أو أضفها لاحقاً من Settings ثم Redeploy).
3. افتح `/Muder` لإدارة المتجر، ثم نزّل `games.json` واستبدل به الملف في المستودع.

## الملفات
- `play.html` : المتجر (`/play`)
- `apps.html` : تطبيقات المتجر الأصلي (`/apps`)، من `apps` في `games.json`
- `game.html` : تشغيل اللعبة (`/game?id=...`)
- `api/home.js` : الصفحة الرئيسية `/` (عنوان وصورة من `home` في `games.json`، وبطاقة تدخل على `/play`)
- `Muder.html` : لوحة التحكم
- `api/meta.js` : دالة Vercel لجلب صورة ووصف اللعبة والتحقق من PWA
- `games.json` : الإعدادات والألعاب
- `vercel.json` : يجعل الرابط /Muder يعمل بدون .html

## زر «نشر الآن» (اختياري)
أضف في Vercel المتغيرات: `GITHUB_TOKEN` (Fine-grained، صلاحية Contents: Read and write لمستودع المتجر فقط) و`GITHUB_REPO` بصيغة `اسمك/المستودع`.
- `api/publish.js` : دالة تحدّث games.json في GitHub
