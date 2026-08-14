@echo off
echo ==============================================
echo Yangi IP manzil bilan Android dasturni yig'ish
echo ==============================================

cd /d "D:\Loyihalar\Hotel ERP\frontend"

echo.
echo 1. Yangi ma'lumotlar bilan dasturni qurish...
call npm run build

echo.
echo 2. Yangilanishlarni Android loyihasiga o'tkazish...
call npx cap sync android

echo.
echo 3. APK faylni yaratish (Compile)...
cd android
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
call .\gradlew assembleDebug

echo.
echo ==============================================
echo BARCHA ISHLAR YAKUNLANDI! 
echo Yangi APK fayl quyidagi manzilda saqlandi:
echo D:\Loyihalar\Hotel ERP\frontend\android\app\build\outputs\apk\debug\app-debug.apk
echo ==============================================
pause
