@echo off
cd /d "d:\Loyihalar\Hotel ERP\backend"
start cmd /k "node src/index.js"
cd /d "d:\Loyihalar\Hotel ERP\frontend"
start cmd /k "npm run dev"
