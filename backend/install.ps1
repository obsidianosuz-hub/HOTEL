npm cache clean --force
Remove-Item -Recurse -Force node_modules\prisma -ErrorAction SilentlyContinue
npm install prisma @prisma/client --no-audit --no-fund
npx prisma generate
