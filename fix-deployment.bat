@echo off
echo Renaming app directory to prevent Vercel conflict...
move app _app_backup
echo Done! Please run the following to push:
echo git add .
echo git commit -m "fix: resolve vercel 403 by renaming conflicting app directory and updating config"
echo git push
pause
