@echo off
rmdir /S /Q node_modules\.prisma
rmdir /S /Q node_modules\@prisma\client
npm install @prisma/client
npx prisma generate
