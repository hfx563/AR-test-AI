@echo off
echo ============================================
echo  Projects Hub - Push to GitHub
echo ============================================
echo.
echo Step 1: Go to https://github.com/new
echo         Create a NEW repo named: projects-hub
echo         Set it to PUBLIC, no README
echo         Click "Create repository"
echo.
pause

cd /d "%~dp0"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/abhiravgotra92/projects-hub.git
git push -u origin main

echo.
echo ============================================
echo  Done! Now enable GitHub Pages:
echo  1. Go to your repo Settings > Pages
echo  2. Source: GitHub Actions
echo  3. Wait ~1 min
echo  Live at: https://abhiravgotra92.github.io/projects-hub/
echo ============================================
pause
