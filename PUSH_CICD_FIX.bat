@echo off
echo ========================================
echo Committing CI/CD Fixes
echo ========================================

cd /d "Y:\AR test AI"

echo Adding files...
"C:\Program Files\Git\bin\git.exe" add .

echo Committing...
"C:\Program Files\Git\bin\git.exe" commit -m "Fix CI/CD: Update Node 24, fix lint exit code, fix artifact upload"

echo Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push origin main

echo.
echo ========================================
echo CI/CD Fixes Deployed!
echo ========================================
pause
